import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { score, type Snapshot } from '../src/domain';

const db = new PGlite();
const owner = '00000000-0000-4000-8000-000000000001';
const player = '00000000-0000-4000-8000-000000000002';
const outsider = '00000000-0000-4000-8000-000000000003';
async function identity(id: string, anonymous = false) {
  await db.exec('reset role');
  await db.query("select set_config('test.uid',$1,false),set_config('test.anonymous',$2,false)", [id, String(anonymous)]);
  await db.exec('set role authenticated');
}
async function scalar<T>(sql: string, params: unknown[] = []): Promise<T> { const r = await db.query<{ value: T }>(sql, params); return r.rows[0].value; }
const create = () => scalar<string>("select public.create_game('La laurea di Giulia','Giulia',null,2,'Organizzatore') as value");
const snapshot = (id: string) => scalar<Snapshot>('select public.game_snapshot($1) as value', [id]);
const cmd = (id: string, command: string, data: Record<string, unknown>) => db.query('select public.game_command($1,$2,$3::jsonb)', [id, command, JSON.stringify(data)]);

describe('migrazione PostgreSQL e autorizzazioni', () => {
  beforeAll(async () => {
    await db.exec(`
      create role anon nologin; create role authenticated nologin;
      create schema auth; create schema realtime;
      create table auth.users(id uuid primary key);
      insert into auth.users values ('${owner}'),('${player}'),('${outsider}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('is_anonymous',coalesce(current_setting('test.anonymous',true),'false')::boolean) $$;
      create table realtime.messages (id bigint generated always as identity primary key,extension text,topic text);
      alter table realtime.messages enable row level security;
      create function realtime.topic() returns text language sql stable as $$ select current_setting('test.topic',true) $$;
      create function realtime.send(jsonb,text,text,boolean) returns void language plpgsql as $$ begin return; end $$;
      grant usage on schema public,auth,realtime to authenticated,anon;
      grant select on realtime.messages to authenticated;
    `);
    await db.exec(readFileSync(new URL('../supabase/migrations/202611060001_initial.sql', import.meta.url), 'utf8'));
  }, 60000);
  beforeEach(async () => { await db.exec('reset role; truncate public.games cascade;'); await identity(owner); });
  afterAll(async () => { await db.close(); });

  it('crea una partita privata e impedisce letture e scritture agli estranei', async () => {
    const id = await create(); const s = await snapshot(id);
    expect(s.game.owner_id).toBe(owner); expect(s.rules).toHaveLength(10);
    await identity(outsider);
    expect((await db.query('select * from public.games')).rows).toHaveLength(0);
    await expect(snapshot(id)).rejects.toThrow('privata');
    await expect(cmd(id, 'add_person', { name: 'Intruso' })).rejects.toThrow('organizzatore');
    await expect(db.query("update public.games set name='Violata' where id=$1", [id])).rejects.toThrow('permission denied');
  });

  it('un invitato entra con il codice ma non ottiene i poteri dell’organizzatore', async () => {
    const id = await create(), s = await snapshot(id);
    await identity(player, true);
    await db.query('select public.join_game($1,$2)', [s.game.code, 'Amico']);
    expect((await snapshot(id)).players).toHaveLength(2);
    await expect(cmd(id, 'set_status', { status: 'draft' })).rejects.toThrow('organizzatore');
    await expect(create()).rejects.toThrow('email');
    await expect(db.query('select public.join_game($1,$2)', ['INVALIDO', 'Amico'])).rejects.toThrow('non valido');
  });

  it('valida le squadre, rende idempotenti gli eventi e ricalcola gli annullamenti', async () => {
    const id = await create();
    await cmd(id, 'add_person', { name: 'Mamma', role: 'Famiglia' });
    await cmd(id, 'add_person', { name: 'Relatore' });
    let s = await snapshot(id); const ids = s.people.map(p => p.id);
    await expect(db.query('select public.save_team($1,$2::uuid[],$3)', [id, ids, ids[0]])).rejects.toThrow('non sono aperte');
    await cmd(id, 'set_status', { status: 'draft' });
    await expect(db.query('select public.save_team($1,$2::uuid[],$3)', [id, [ids[0], ids[0]], ids[0]])).rejects.toThrow('diversi');
    await expect(db.query('select public.save_team($1,$2::uuid[],$3)', [id, ids, outsider])).rejects.toThrow('capitano');
    await db.query('select public.save_team($1,$2::uuid[],$3)', [id, ids, ids[0]]);
    await expect(cmd(id, 'remove_person', { id: ids[0] })).rejects.toThrow('già in una squadra');
    await expect(cmd(id, 'update_game', { name: 'Nuovo', graduate: 'Giulia', team_size: 3, date: '' })).rejects.toThrow('dimensione');
    await cmd(id, 'set_status', { status: 'live' });
    await expect(db.query('select public.save_team($1,$2::uuid[],$3)', [id, ids, ids[0]])).rejects.toThrow('non sono aperte');
    const rule = s.rules.find(r => r.points === 10)!;
    const data = { person_id: ids[0], rule_id: rule.id, request_id: crypto.randomUUID() };
    await cmd(id, 'record_event', data); await cmd(id, 'record_event', data);
    s = await snapshot(id); expect(s.events).toHaveLength(1); expect(score(s.players[0], s.events)).toBe(20);
    await cmd(id, 'undo_event', { id: s.events[0].id }); s = await snapshot(id);
    expect(score(s.players[0], s.events)).toBe(0); expect(s.events[0].revoked).toBe(true);
    await cmd(id, 'set_status', { status: 'finished' });
    await expect(cmd(id, 'record_event', { ...data, request_id: crypto.randomUUID() })).rejects.toThrow('Avvia');
    await expect(cmd(id, 'undo_event', { id: s.events[0].id })).rejects.toThrow('durante');
  });

  it('rifiuta persone e regole appartenenti ad altre lauree', async () => {
    const first = await create();
    await cmd(first, 'add_person', { name: 'Persona A' }); await cmd(first, 'add_person', { name: 'Persona B' });
    await cmd(first, 'set_status', { status: 'draft' });
    const a = await snapshot(first), ids = a.people.map(p => p.id);
    await db.query('select public.save_team($1,$2::uuid[],$3)', [first, ids, ids[0]]); await cmd(first, 'set_status', { status: 'live' });
    const second = await create(); await cmd(second, 'add_person', { name: 'Estraneo' }); const b = await snapshot(second);
    await expect(cmd(first, 'record_event', { person_id: b.people[0].id, rule_id: a.rules[0].id, request_id: crypto.randomUUID() })).rejects.toThrow('Protagonista');
    await expect(cmd(first, 'record_event', { person_id: ids[0], rule_id: b.rules[0].id, request_id: crypto.randomUUID() })).rejects.toThrow('Regola');
  });
});
