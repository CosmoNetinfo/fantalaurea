import { expect, test } from '@playwright/test';

test('Google usa Supabase e conserva la destinazione di organizzatori e invitati', async ({ page }) => {
  await page.route('**/auth/v1/authorize?**', route => route.fulfill({
    status: 200, contentType: 'text/html', body: '<html lang="it"><body>Provider OAuth simulato</body></html>',
  }));
  for (const path of ['/organizza', '/invito/ABCDEF123456']) {
    await page.goto(path);
    const button = page.getByRole('button', { name: 'Continua con Google' });
    await expect(button).toBeVisible();
    const request = page.waitForRequest(r => new URL(r.url()).pathname === '/auth/v1/authorize');
    await button.click();
    const url = new URL((await request).url());
    expect(url.searchParams.get('provider')).toBe('google');
    expect(url.searchParams.get('redirect_to')).toBe(`http://127.0.0.1:5173${path}`);
    await expect(page.getByText('Provider OAuth simulato')).toBeVisible();
  }
});
