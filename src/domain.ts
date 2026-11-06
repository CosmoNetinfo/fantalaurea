export type Status = 'setup' | 'draft' | 'live' | 'finished';
export type Person = { id: string; name: string; role: string };
export type Rule = { id: string; name: string; points: number; emoji: string };
export type Player = { user_id: string; nickname: string; team: string[]; captain: string | null; joined_at: string };
export type GameEvent = { id: string; person_id: string; person_name: string; rule_name: string; emoji: string; points: number; created_at: string; revoked: boolean };
export type Game = { id: string; code: string; name: string; graduate: string; date: string; team_size: number; status: Status; owner_id: string; created_at: string };
export type Snapshot = { game: Game; people: Person[]; rules: Rule[]; players: Player[]; events: GameEvent[]; user_id: string };
export const statusLabel: Record<Status, string> = { setup: 'In preparazione', draft: 'Squadre aperte', live: 'Si gioca!', finished: 'Conclusa' };
export const presets: Omit<Rule, 'id'>[] = [
  { name: 'Piange di gioia', points: 10, emoji: '🥹' }, { name: 'Battuta memorabile', points: 8, emoji: '😂' },
  { name: 'Primo brindisi', points: 5, emoji: '🥂' }, { name: 'Applauso spontaneo', points: 5, emoji: '👏' },
  { name: 'Foto con il laureando', points: 3, emoji: '📸' }, { name: 'Discorso improvvisato', points: 8, emoji: '🎤' },
  { name: 'Telefono che squilla', points: -5, emoji: '📱' }, { name: 'Arriva in ritardo', points: -5, emoji: '⏰' },
  { name: 'Dimentica il nome', points: -3, emoji: '🙈' }, { name: 'Bicchiere rovesciato', points: -3, emoji: '💧' },
];
export function score(player: Player, events: GameEvent[]) {
  return events.filter(e => !e.revoked && player.team.includes(e.person_id)).reduce((sum, e) => sum + e.points * (player.captain === e.person_id ? 2 : 1), 0);
}
export function leaderboard(s: Snapshot) {
  return s.players.map(p => ({ ...p, score: score(p, s.events) })).sort((a, b) => b.score - a.score || a.joined_at.localeCompare(b.joined_at) || a.user_id.localeCompare(b.user_id));
}
export function validateTeam(team: string[], captain: string | null, people: Person[], size: number) {
  if (team.length !== size || new Set(team).size !== size) throw new Error(`Scegli ${size} protagonisti diversi.`);
  if (!captain || !team.includes(captain)) throw new Error('Scegli il capitano fra i protagonisti della squadra.');
  if (team.some(id => !people.some(p => p.id === id))) throw new Error('Un protagonista non è più disponibile.');
}
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
export function dateLabel(date: string) {
  return date ? new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date + 'T12:00:00')) : 'La tua giornata speciale';
}
