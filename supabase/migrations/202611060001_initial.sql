-- FantaLaurea v2. Apply to a new Supabase project, never to the old Firebase app.
begin;
create table public.games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  name text not null check (char_length(name) between 2 and 100),
  graduate text not null check (char_length(graduate) between 1 and 60),
  date date,
  team_size integer not null default 3 check (team_size between 1 and 10),
  status text not null default 'setup' check (status in ('setup','draft','live','finished')),
  created_at timestamptz not null default now()
);
create table public.members (
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  nickname text not null check (char_length(nickname) between 2 and 30),
  team uuid[] not null default '{}',
  captain uuid,
  joined_at timestamptz not null default now(),
  primary key (game_id,user_id)
);
create index members_user_idx on public.members(user_id, game_id);
create index games_owner_idx on public.games(owner_id);
create table public.people (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  role text not null default '' check (char_length(role) <= 100),
  created_at timestamptz not null default now()
);
create index people_game_idx on public.people(game_id);
create table public.rules (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  emoji text not null default '✨' check (char_length(emoji) <= 16),
  points integer not null check (points between -100 and 100 and points <> 0),
  created_at timestamptz not null default now()
);
create index rules_game_idx on public.rules(game_id);
create table public.game_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  request_id uuid not null unique,
  person_id uuid not null references public.people(id),
  person_name text not null,
  rule_name text not null,
  emoji text not null,
  points integer not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  revoked boolean not null default false
);
create index game_events_game_idx on public.game_events(game_id, created_at desc);

-- Definer helpers prevent recursive membership policies. No public execution.
create function public.is_game_member(p_game_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.members where game_id=p_game_id and user_id=(select auth.uid()));
$$;
revoke all on function public.is_game_member(uuid) from public;
grant execute on function public.is_game_member(uuid) to authenticated;

alter table public.games enable row level security;
alter table public.members enable row level security;
alter table public.people enable row level security;
alter table public.rules enable row level security;
alter table public.game_events enable row level security;
create policy member_reads_game on public.games for select to authenticated using (public.is_game_member(id));
create policy member_reads_members on public.members for select to authenticated using (public.is_game_member(game_id));
create policy member_reads_people on public.people for select to authenticated using (public.is_game_member(game_id));
create policy member_reads_rules on public.rules for select to authenticated using (public.is_game_member(game_id));
create policy member_reads_events on public.game_events for select to authenticated using (public.is_game_member(game_id));
revoke all on public.games, public.members, public.people, public.rules, public.game_events from anon, authenticated;
grant select on public.games, public.members, public.people, public.rules, public.game_events to authenticated;

create function public.create_game(p_name text, p_graduate text, p_date date, p_team_size integer, p_nickname text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,true) then
    raise exception 'Accedi con la tua email per creare una laurea.';
  end if;
  if (select count(*) from public.games where owner_id=auth.uid() and status <> 'finished') >= 10 then
    raise exception 'Hai già dieci lauree aperte. Concludine una prima di continuare.';
  end if;
  insert into public.games(owner_id,name,graduate,date,team_size) values(auth.uid(),trim(p_name),trim(p_graduate),p_date,p_team_size) returning id into v_id;
  insert into public.members(game_id,user_id,nickname) values(v_id,auth.uid(),trim(p_nickname));
  insert into public.rules(game_id,name,points,emoji) values
    (v_id,'Piange di gioia',10,'🥹'),(v_id,'Battuta memorabile',8,'😂'),(v_id,'Primo brindisi',5,'🥂'),
    (v_id,'Applauso spontaneo',5,'👏'),(v_id,'Foto con il laureando',3,'📸'),(v_id,'Discorso improvvisato',8,'🎤'),
    (v_id,'Telefono che squilla',-5,'📱'),(v_id,'Arriva in ritardo',-5,'⏰'),(v_id,'Dimentica il nome',-3,'🙈'),(v_id,'Bicchiere rovesciato',-3,'💧');
  return v_id;
end $$;

create function public.my_games() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(g) order by g.created_at desc),'[]'::jsonb)
  from public.games g where exists(select 1 from public.members m where m.game_id=g.id and m.user_id=auth.uid());
$$;

create function public.join_game(p_code text,p_nickname text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_game public.games;
begin
  if auth.uid() is null then raise exception 'Accedi per partecipare.'; end if;
  select * into v_game from public.games where code=upper(trim(p_code)) for update;
  if not found then raise exception 'Codice invito non valido.'; end if;
  if exists(select 1 from public.members where game_id=v_game.id and user_id=auth.uid()) then return v_game.id; end if;
  if v_game.status='finished' then raise exception 'Questa laurea è già conclusa.'; end if;
  if (select count(*) from public.members where game_id=v_game.id) >= 300 then raise exception 'Questa partita ha raggiunto il limite di 300 partecipanti.'; end if;
  insert into public.members(game_id,user_id,nickname) values(v_game.id,auth.uid(),trim(p_nickname));
  return v_game.id;
end $$;

create function public.save_team(p_game_id uuid,p_team uuid[],p_captain uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_game public.games;
begin
  select * into v_game from public.games where id=p_game_id for update;
  if not public.is_game_member(p_game_id) then raise exception 'Non partecipi a questa laurea.'; end if;
  if v_game.status <> 'draft' then raise exception 'Le squadre non sono aperte.'; end if;
  if p_team is null or cardinality(p_team) <> v_game.team_size or
    (select count(distinct x) from unnest(p_team) x) <> v_game.team_size then raise exception 'Scegli il numero richiesto di protagonisti diversi.'; end if;
  if p_captain is null or not(p_captain=any(p_team)) then raise exception 'Scegli un capitano della tua squadra.'; end if;
  if (select count(*) from public.people where game_id=p_game_id and id=any(p_team)) <> v_game.team_size then raise exception 'Un protagonista non è disponibile.'; end if;
  update public.members set team=p_team,captain=p_captain where game_id=p_game_id and user_id=auth.uid();
end $$;

create function public.game_command(p_game_id uuid,p_command text,p_data jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare v_game public.games; v_person public.people; v_rule public.rules; v_status text; v_id uuid;
begin
  -- Serializes state transitions, team changes and scoring inside one transaction.
  select * into v_game from public.games where id=p_game_id for update;
  if not found or v_game.owner_id is distinct from auth.uid() then raise exception 'Operazione riservata all’organizzatore.'; end if;
  if p_command in ('update_game','add_person','remove_person','add_rule','remove_rule') and v_game.status not in ('setup','draft') then
    raise exception 'La preparazione è bloccata dopo l’inizio del gioco.';
  end if;
  case p_command
    when 'update_game' then
      if (p_data->>'team_size')::integer <> v_game.team_size and exists(select 1 from public.members where game_id=p_game_id and cardinality(team)>0) then
        raise exception 'Non puoi cambiare la dimensione dopo la scelta delle squadre.';
      end if;
      update public.games set name=trim(p_data->>'name'),graduate=trim(p_data->>'graduate'),date=nullif(p_data->>'date','')::date,team_size=(p_data->>'team_size')::integer where id=p_game_id;
    when 'add_person' then
      if (select count(*) from public.people where game_id=p_game_id)>=100 then raise exception 'Puoi aggiungere al massimo 100 protagonisti.'; end if;
      insert into public.people(game_id,name,role) values(p_game_id,trim(p_data->>'name'),trim(coalesce(p_data->>'role','')));
    when 'remove_person' then
      v_id := (p_data->>'id')::uuid;
      if exists(select 1 from public.members where game_id=p_game_id and v_id=any(team)) then raise exception 'Questo protagonista è già in una squadra.'; end if;
      delete from public.people where id=v_id and game_id=p_game_id;
    when 'add_rule' then
      if (select count(*) from public.rules where game_id=p_game_id)>=100 then raise exception 'Puoi aggiungere al massimo 100 regole.'; end if;
      insert into public.rules(game_id,name,points,emoji) values(p_game_id,trim(p_data->>'name'),(p_data->>'points')::integer,coalesce(nullif(p_data->>'emoji',''),'✨'));
    when 'remove_rule' then delete from public.rules where id=(p_data->>'id')::uuid and game_id=p_game_id;
    when 'set_status' then
      v_status := p_data->>'status';
      if not ((v_game.status='setup' and v_status='draft') or (v_game.status='draft' and v_status='live') or (v_game.status='live' and v_status='finished')) then
        raise exception 'Passaggio di stato non valido.';
      end if;
      if v_status='draft' and ((select count(*) from public.people where game_id=p_game_id)<v_game.team_size or not exists(select 1 from public.rules where game_id=p_game_id)) then
        raise exception 'Aggiungi protagonisti sufficienti e almeno una regola.';
      end if;
      if v_status='live' and not exists(select 1 from public.members where game_id=p_game_id and cardinality(team)=v_game.team_size) then raise exception 'Serve almeno una squadra completa.'; end if;
      update public.games set status=v_status where id=p_game_id;
    when 'record_event' then
      if v_game.status <> 'live' then raise exception 'Avvia il gioco prima di assegnare punti.'; end if;
      select * into v_person from public.people where id=(p_data->>'person_id')::uuid and game_id=p_game_id;
      if not found then raise exception 'Protagonista non disponibile.'; end if;
      select * into v_rule from public.rules where id=(p_data->>'rule_id')::uuid and game_id=p_game_id;
      if not found then raise exception 'Regola non disponibile.'; end if;
      if (select count(*) from public.game_events where game_id=p_game_id)>=2000 then raise exception 'Limite di eventi raggiunto.'; end if;
      insert into public.game_events(game_id,request_id,person_id,person_name,rule_name,emoji,points,created_by)
        values(p_game_id,(p_data->>'request_id')::uuid,v_person.id,v_person.name,v_rule.name,v_rule.emoji,v_rule.points,auth.uid())
        on conflict(request_id) do nothing;
    when 'undo_event' then
      if v_game.status <> 'live' then raise exception 'Le correzioni sono disponibili durante il gioco.'; end if;
      update public.game_events set revoked=true where id=(p_data->>'id')::uuid and game_id=p_game_id;
    else raise exception 'Operazione non disponibile.';
  end case;
end $$;

create function public.game_snapshot(p_game_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_game_member(p_game_id) then raise exception 'Questa laurea è privata. Entra con il link di invito.'; end if;
  return jsonb_build_object(
    'game',(select to_jsonb(g) from public.games g where g.id=p_game_id),
    'user_id',auth.uid(),
    'people',coalesce((select jsonb_agg(to_jsonb(p) order by created_at,id) from public.people p where game_id=p_game_id),'[]'::jsonb),
    'rules',coalesce((select jsonb_agg(to_jsonb(r) order by points desc,id) from public.rules r where game_id=p_game_id),'[]'::jsonb),
    'players',coalesce((select jsonb_agg(to_jsonb(m) order by joined_at,user_id) from public.members m where game_id=p_game_id),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(to_jsonb(e) order by created_at desc,id) from public.game_events e where game_id=p_game_id),'[]'::jsonb)
  );
end $$;

revoke all on function public.create_game(text,text,date,integer,text), public.my_games(), public.join_game(text,text), public.save_team(uuid,uuid[],uuid), public.game_command(uuid,text,jsonb), public.game_snapshot(uuid) from public;
grant execute on function public.create_game(text,text,date,integer,text), public.my_games(), public.join_game(text,text), public.save_team(uuid,uuid[],uuid), public.game_command(uuid,text,jsonb), public.game_snapshot(uuid) to authenticated;

-- Send small invalidation messages on private event channels, not entire row payloads.
create function public.notify_game_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_game_id uuid;
begin
  if TG_TABLE_NAME='games' then v_game_id := coalesce(NEW.id,OLD.id); else v_game_id := coalesce(NEW.game_id,OLD.game_id); end if;
  perform realtime.send(jsonb_build_object('changed',true),'changed','game:'||v_game_id::text,true);
  return null;
end $$;
revoke all on function public.notify_game_change() from public;
create trigger games_changed after insert or update or delete on public.games for each row execute function public.notify_game_change();
create trigger members_changed after insert or update or delete on public.members for each row execute function public.notify_game_change();
create trigger people_changed after insert or update or delete on public.people for each row execute function public.notify_game_change();
create trigger rules_changed after insert or update or delete on public.rules for each row execute function public.notify_game_change();
create trigger events_changed after insert or update or delete on public.game_events for each row execute function public.notify_game_change();
create policy game_broadcast_read on realtime.messages for select to authenticated using (
  extension='broadcast' and exists(select 1 from public.members m where m.user_id=(select auth.uid()) and 'game:'||m.game_id::text=(select realtime.topic()))
);
commit;
