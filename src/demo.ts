import { type Snapshot, presets, validateTeam, type Status } from './domain';
const key = 'fantalaurea.demo.v2';
export function createDemo(): Snapshot {
  const now = new Date().toISOString();
  return {
    user_id: 'demo-owner',
    game: { id: 'demo', code: 'DEMO', name: 'La laurea di Giulia', graduate: 'Giulia', date: '2026-11-20', team_size: 3, status: 'setup', owner_id: 'demo-owner', created_at: now },
    people: [{ id: 'p1', name: 'Mamma Anna', role: 'La prima a commuoversi' }, { id: 'p2', name: 'Prof. Rossi', role: 'Il relatore' }, { id: 'p3', name: 'Luca', role: 'Amico storico' }, { id: 'p4', name: 'Papà Marco', role: 'Il fotografo ufficiale' }, { id: 'p5', name: 'Sara', role: 'Amica del cuore' }, { id: 'p6', name: 'Nonna Franca', role: 'La vera protagonista' }],
    rules: presets.map((r, i) => ({ ...r, id: `r${i}` })),
    players: [{ user_id: 'demo-owner', nickname: 'Tu', team: [], captain: null, joined_at: now }, { user_id: 'demo-luca', nickname: 'Luca & la lode', team: ['p1', 'p2', 'p4'], captain: 'p1', joined_at: now }, { user_id: 'demo-sara', nickname: '110 e spritz', team: ['p3', 'p5', 'p6'], captain: 'p6', joined_at: now }], events: [],
  };
}
export function readDemo(): Snapshot {
  try { const raw = localStorage.getItem(key); if (raw) { const data = JSON.parse(raw); if (data.game?.id === 'demo' && Array.isArray(data.players)) return data; } } catch { /* recover from invalid browser storage */ }
  return createDemo();
}
export function writeDemo(s: Snapshot) { localStorage.setItem(key, JSON.stringify(s)); }
export function demoCommand(s: Snapshot, command: string, data: Record<string, unknown>): Snapshot {
  const next = structuredClone(s);
  const editable = ['setup', 'draft'].includes(next.game.status);
  if (command === 'update_game') { if (!editable) throw new Error('La preparazione è bloccata.'); if (Number(data.team_size) !== next.game.team_size && next.players.some(p => p.team.length > 0)) throw new Error('Non puoi cambiare la dimensione dopo la scelta delle squadre.'); next.game = { ...next.game, name: String(data.name), graduate: String(data.graduate), date: String(data.date), team_size: Number(data.team_size) }; }
  else if (command === 'add_person') { if (!editable) throw new Error('I protagonisti sono bloccati.'); next.people.push({ id: crypto.randomUUID(), name: String(data.name), role: String(data.role || '') }); }
  else if (command === 'remove_person') { if (!editable) throw new Error('I protagonisti sono bloccati.'); if (next.players.some(p => p.team.includes(String(data.id)))) throw new Error('Questo protagonista è già in una squadra.'); next.people = next.people.filter(p => p.id !== data.id); }
  else if (command === 'add_rule') { if (!editable) throw new Error('Le regole sono bloccate.'); if (!Number.isInteger(data.points) || Number(data.points) === 0 || Math.abs(Number(data.points)) > 100) throw new Error('Scegli un punteggio intero fra −100 e +100, diverso da zero.'); next.rules.push({ id: crypto.randomUUID(), name: String(data.name), emoji: String(data.emoji || '✨'), points: Number(data.points) }); }
  else if (command === 'remove_rule') { if (!editable) throw new Error('Le regole sono bloccate.'); next.rules = next.rules.filter(r => r.id !== data.id); }
  else if (command === 'set_status') {
    const status = data.status as Status;
    const order: Status[] = ['setup', 'draft', 'live', 'finished'];
    if (order.indexOf(status) !== order.indexOf(next.game.status) + 1) throw new Error('Passaggio di stato non valido.');
    if (status === 'draft' && (next.people.length < next.game.team_size || !next.rules.length)) throw new Error('Aggiungi protagonisti sufficienti e almeno una regola.');
    if (status === 'live' && !next.players.some(p => p.team.length === next.game.team_size)) throw new Error('Serve almeno una squadra completa.');
    next.game.status = status;
  } else if (command === 'record_event') {
    if (next.game.status !== 'live') throw new Error('Avvia il gioco prima di assegnare punti.');
    if (next.events.some(e => e.id === data.request_id)) return next;
    const person = next.people.find(p => p.id === data.person_id), rule = next.rules.find(r => r.id === data.rule_id);
    if (!person || !rule) throw new Error('Seleziona un protagonista e una regola.');
    next.events.unshift({ id: String(data.request_id), person_id: person.id, person_name: person.name, rule_name: rule.name, emoji: rule.emoji, points: rule.points, created_at: new Date().toISOString(), revoked: false });
  } else if (command === 'undo_event') {
    if (next.game.status !== 'live') throw new Error('Le correzioni sono disponibili durante il gioco.');
    const event = next.events.find(e => e.id === data.id); if (event) event.revoked = true;
  } else throw new Error('Operazione non disponibile.');
  return next;
}
export function demoTeam(s: Snapshot, team: string[], captain: string | null): Snapshot {
  if (s.game.status !== 'draft') throw new Error('Le squadre non sono aperte.');
  validateTeam(team, captain, s.people, s.game.team_size);
  const next = structuredClone(s); const p = next.players.find(p => p.user_id === next.user_id)!;
  p.team = team; p.captain = captain; return next;
}
