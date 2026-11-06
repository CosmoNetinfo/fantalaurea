export type Mode = 'light' | 'dark' | 'system';
export type Palette = 'gold' | 'forest' | 'ocean';
export type Appearance = { mode: Mode; palette: Palette };
export const appearanceKey = 'fantalaurea.appearance.v1';
export function readAppearance(): Appearance {
  try {
    const value = JSON.parse(localStorage.getItem(appearanceKey) || '{}');
    return {
      mode: ['light', 'dark', 'system'].includes(value.mode) ? value.mode : 'system',
      palette: ['gold', 'forest', 'ocean'].includes(value.palette) ? value.palette : 'gold',
    };
  } catch { return { mode: 'system', palette: 'gold' }; }
}
export function applyAppearance(value: Appearance) {
  const dark = value.mode === 'dark' || (value.mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.mode = dark ? 'dark' : 'light';
  document.documentElement.dataset.palette = value.palette;
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121212' : '#faf9f6');
}
export function saveAppearance(value: Appearance) {
  applyAppearance(value);
  try { localStorage.setItem(appearanceKey, JSON.stringify(value)); } catch { /* preferences still work for the current visit */ }
}
applyAppearance(readAppearance());
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyAppearance(readAppearance()));
window.addEventListener('storage', event => { if (event.key === appearanceKey) applyAppearance(readAppearance()); });
