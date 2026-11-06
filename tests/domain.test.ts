import { describe, expect, it } from 'vitest';
import { createDemo, demoCommand, demoTeam } from '../src/demo';
import { leaderboard, score, validateTeam } from '../src/domain';

describe('regole del gioco', () => {
  it('raddoppia bonus e malus del capitano e ignora gli eventi annullati', () => {
    const s = createDemo(); s.game.status = 'live';
    let next = demoCommand(s, 'record_event', { person_id: 'p1', rule_id: 'r0', request_id: 'a' });
    next = demoCommand(next, 'record_event', { person_id: 'p1', rule_id: 'r6', request_id: 'b' });
    expect(score(next.players[1], next.events)).toBe(10);
    next = demoCommand(next, 'undo_event', { id: 'b' });
    expect(score(next.players[1], next.events)).toBe(20);
  });
  it('rifiuta duplicati, capitani esterni e protagonisti inesistenti', () => {
    const s = createDemo();
    expect(() => validateTeam(['p1', 'p1', 'p2'], 'p1', s.people, 3)).toThrow();
    expect(() => validateTeam(['p1', 'p2', 'p3'], 'p4', s.people, 3)).toThrow();
    expect(() => validateTeam(['p1', 'p2', 'missing'], 'p1', s.people, 3)).toThrow();
  });
  it('blocca modifiche alle squadre dopo il draft e impedisce doppi eventi', () => {
    const s = createDemo(); s.game.status = 'live';
    expect(() => demoTeam(s, ['p1', 'p2', 'p3'], 'p1')).toThrow();
    const data = { person_id: 'p1', rule_id: 'r0', request_id: 'same' };
    const next = demoCommand(demoCommand(s, 'record_event', data), 'record_event', data);
    expect(next.events).toHaveLength(1);
  });
  it('ordina i pari merito per ingresso e non modifica il dato originale', () => {
    const s = createDemo(); s.players[0].joined_at = '2026-01-01T00:00:00Z';
    expect(leaderboard(s)[0].user_id).toBe('demo-owner');
    const next = demoCommand(s, 'add_person', { name: 'Nuovo', role: 'Amico' });
    expect(next.people).toHaveLength(s.people.length + 1);
    expect(s.people).toHaveLength(6);
  });
});
