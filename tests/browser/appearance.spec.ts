import { expect, test, type Page } from '@playwright/test';

async function contrastFailures(page: Page) {
  return page.evaluate(() => {
    const rgb = (value: string) => (value.match(/[\d.]+/g) || []).map(Number);
    const luminance = (color: number[]) => color.slice(0, 3).map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((s, x, i) => s + x * [.2126, .7152, .0722][i], 0);
    const background = (node: Element): number[] => {
      const color = rgb(getComputedStyle(node).backgroundColor);
      if (color.length < 4 || color[3] === 1) return color;
      const parent = node.parentElement ? background(node.parentElement) : [255, 255, 255];
      return color.slice(0, 3).map((x, i) => x * color[3] + parent[i] * (1 - color[3]));
    };
    const selectors = '.page-heading p,.field>span,.stat-card>div>span,.stat-card>small,.check-row strong,.check-row small,.event-card-middle p,.event-card-bottom>span,.sidebar-link,.sidebar-game>strong,.sidebar-game>span,.mobile-nav>button>span,.panel-heading h2,.empty h3,.empty p,.hero-copy>p,.hero-note,.button:not(:disabled),.demo-link,.rules-steps p';
    return [...document.querySelectorAll(selectors)].filter(node => { const r = node.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map(node => {
      const style = getComputedStyle(node), fg = luminance(rgb(style.color)), bg = luminance(background(node));
      const ratio = (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05);
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
      return { text: node.textContent?.trim().slice(0, 75), ratio: Number(ratio.toFixed(2)), required: large ? 3 : 4.5 };
    }).filter(result => result.ratio + .02 < result.required);
  });
}

test('palette e modalità restano leggibili e si conservano dopo il ricaricamento', async ({ page }, testInfo) => {
  await page.goto('/demo');
  for (const palette of ['Oro', 'Verde', 'Blu']) {
    for (const mode of ['Chiaro', 'Scuro']) {
      await page.getByRole('button', { name: 'Impostazioni app' }).click();
      const dialog = page.getByRole('dialog', { name: 'App e aspetto' });
      await dialog.getByRole('button', { name: palette, exact: false }).click();
      await dialog.getByRole('button', { name: mode, exact: true }).click();
      await page.keyboard.press('Escape');
      await expect(page.locator('html')).toHaveAttribute('data-mode', mode === 'Scuro' ? 'dark' : 'light');
      expect(await contrastFailures(page), `${palette} / ${mode}`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (palette === 'Oro') await page.screenshot({ path: `.checks/premium-${mode.toLowerCase()}-${testInfo.project.name}.png`, fullPage: true });
    }
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'ocean');
  await expect(page.locator('.topbar-right').getByRole('button', { name: 'Impostazioni app' })).toBeVisible();
  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({ width: 320, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const settings = await page.getByRole('button', { name: 'Impostazioni app' }).boundingBox();
    const action = await page.getByRole('button', { name: 'Apri le squadre', exact: true }).boundingBox();
    expect(settings && action && settings.y + settings.height < action.y).toBe(true);
  }
});

test('regolamento completo per organizzatori e invitati anche su telefono stretto', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/regole');
  await expect(page.getByRole('heading', { name: 'Per chi organizza', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Per chi gioca/ }).click();
  await expect(page.getByRole('heading', { name: 'Per chi gioca', exact: true })).toBeInViewport();
  await expect(page.getByText('−10 PT', { exact: true })).toBeVisible();
  await page.getByText('La demo è una partita vera?', { exact: true }).click();
  await expect(page.getByText(/La demo serve a provare tutte le azioni/)).toBeVisible();
  expect(await contrastFailures(page)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `.checks/regole-${testInfo.project.name}.png`, fullPage: true });
});

test('il tema chiaro premium è leggibile nella pagina iniziale', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Impostazioni app' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Chiaro', exact: true }).click();
  await page.keyboard.press('Escape');
  expect(await contrastFailures(page)).toEqual([]);
  await page.locator('.site-header .brand').screenshot({ path: `.checks/brand-${testInfo.project.name}.png` });
  await page.screenshot({ path: `.checks/premium-home-${testInfo.project.name}.png`, fullPage: true });
});
