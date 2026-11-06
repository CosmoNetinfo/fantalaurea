import { expect, test } from '@playwright/test';

test('manifest e icone installabili con dimensioni reali', async ({ page, request }) => {
  await page.goto('/');
  const link = await page.locator('link[rel="manifest"]').getAttribute('href');
  const response = await request.get(link!);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.name).toBe('FantaLaurea');
  expect(manifest.display).toBe('standalone');
  expect(manifest.scope).toBe('/');
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src); const bytes = await response.body();
    expect(response.ok()).toBe(true);
    const size = Number(icon.sizes.split('x')[0]);
    expect(bytes.readUInt32BE(16)).toBe(size);
    expect(bytes.readUInt32BE(20)).toBe(size);
  }
  const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  const png = await (await request.get(apple!)).body(); expect(png.readUInt32BE(16)).toBe(180);
});

test('app shell, regolamento e demo funzionano offline senza simulare partite online', async ({ page, context }) => {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: /Ci siamo/ })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.goto('/regole');
  await expect(page.getByRole('heading', { name: 'Per chi gioca', exact: true })).toBeVisible();
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: /Ci siamo/ })).toBeVisible();
  await page.getByRole('button', { name: 'Apri le squadre', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Conferma' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const caches = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await window.caches.keys()) for (const key of await (await window.caches.open(name)).keys()) urls.push(key.url);
    return urls;
  });
  expect(caches.some(url => /supabase\.co\/(auth|rest)/.test(url))).toBe(false);
});
