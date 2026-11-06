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

const user = {
  id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated',
  email: 'organizer@example.test', is_anonymous: false,
  app_metadata: { provider: 'google', providers: ['google'] }, user_metadata: { full_name: 'Organizzatore' },
  created_at: '2026-11-06T00:00:00Z',
};
const callbackHash = '#access_token=callback-test-token&refresh_token=callback-test-refresh&expires_in=3600&token_type=bearer';

test('un ritorno Google valido apre la creazione della laurea e sopravvive al ricaricamento', async ({ page }) => {
  await page.route('**/auth/v1/user', route => route.fulfill({ json: user }));
  await page.route('**/rest/v1/rpc/my_games', route => route.fulfill({ json: [] }));
  await page.goto('/organizza' + callbackHash);
  await expect(page.getByRole('heading', { name: 'Crea una nuova FantaLaurea' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continua con Google' })).toHaveCount(0);
  await expect(page).toHaveURL(/\/organizza$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Crea una nuova FantaLaurea' })).toBeVisible();
});

test('un callback arrivato alla home ritrova la destinazione senza chiedere un altro login', async ({ page }) => {
  await page.route('**/auth/v1/user', route => route.fulfill({ json: user }));
  await page.route('**/rest/v1/rpc/my_games', route => route.fulfill({ json: [] }));
  await page.goto('/' + callbackHash);
  await expect(page).toHaveURL(/\/organizza$/);
  await expect(page.getByRole('heading', { name: 'Crea una nuova FantaLaurea' })).toBeVisible();
});

test('un errore Google viene spiegato invece di mostrare di nuovo il login', async ({ page }) => {
  await page.goto('/organizza?error=server_error&error_description=Unable+to+exchange+external+code%3A+private-code');
  await expect(page.getByRole('heading', { name: 'Accesso da completare.' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Client Secret');
  await expect(page.getByRole('button', { name: 'Continua con Google' })).toHaveCount(0);
  await expect(page).toHaveURL(/\/organizza$/);
  await expect(page.locator('body')).not.toContainText('private-code');
});
