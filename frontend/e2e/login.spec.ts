import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3003';

test.describe('Authentification', () => {
  test('la page de login est accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveTitle(/SANTAREX/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('un login avec mauvais credentials affiche une erreur', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'mauvais@test.ci');
    await page.fill('input[type="password"]', 'mauvaismdp');
    await page.click('button[type="submit"]');
    // L'erreur doit apparaître (le message exact dépend de l'implémentation)
    await expect(page.locator('text=/incorrect|invalide|erreur/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Landing page', () => {
  test('la page d\'accueil charge correctement', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/SANTAREX/);
    await expect(page.locator('text=SANTAREX')).toBeVisible();
  });

  test('les liens légaux fonctionnent', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=CGU');
    await expect(page).toHaveURL(/\/cgu/);
    await expect(page.locator('h1')).toContainText(/Conditions/i);
  });

  test('la page confidentialité est accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/confidentialite`);
    await expect(page.locator('h1')).toContainText(/confidentialit/i);
  });

  test('la page guide est accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide`);
    await expect(page.locator('h1')).toContainText(/Guide/i);
    await expect(page.locator('details')).toHaveCount({ minimum: 5 } as any);
  });
});

test.describe('SEO & accessibilité', () => {
  test('robots.txt est servi', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/robots.txt`);
    expect(res?.status()).toBe(200);
    const body = await res?.text();
    expect(body).toContain('User-agent');
    expect(body).toContain('Disallow: /dashboard');
  });

  test('sitemap.xml est servi', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/sitemap.xml`);
    expect(res?.status()).toBe(200);
  });

  test('la page de retour paiement s\'affiche correctement', async ({ page }) => {
    await page.goto(`${BASE_URL}/paiement/retour?status=SUCCESS&transaction_id=TEST-123`);
    await expect(page.locator('text=/Paiement confirmé|confirmé/i')).toBeVisible();
  });
});
