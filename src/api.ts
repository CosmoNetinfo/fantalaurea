import { createClient } from '@supabase/supabase-js';
import type { Game, Snapshot } from './domain';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export async function rpc<T>(fn: string, params: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw new Error('Il servizio non è ancora collegato. Puoi esplorare la demo.');
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw new Error(error.message);
  return data as T;
}
export async function guest() {
  if (!supabase) throw new Error('Il servizio non è ancora collegato.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { const { error } = await supabase.auth.signInAnonymously(); if (error) throw error; }
}
export const getGame = (id: string) => rpc<Snapshot>('game_snapshot', { p_game_id: id });
export const myGames = () => rpc<Game[]>('my_games');
export const command = (id: string, action: string, payload: Record<string, unknown>) => rpc('game_command', { p_game_id: id, p_command: action, p_data: payload });
