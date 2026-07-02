/**
 * Journey 3: Toggle dark-mode theme → reload → setting persists
 */
import { test, expect } from '@playwright/test';
import { loginAs, MOCK_CITIZEN } from './helpers';

test('dark mode toggle applies dark class and persists to localStorage', async ({ page }) => {
  await loginAs(page, MOCK_CITIZEN);

  // ThemeSettings calls PATCH /auth/me/ when saving theme preference
  await page.route('**/api/v1/auth/me/', (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({ json: { ...MOCK_CITIZEN, theme_preference: 'dark' } });
    }
    return route.fulfill({ json: MOCK_CITIZEN });
  });

  await page.goto('/settings/theme');

  // Theme page has three buttons: "Light", "Dark", "System" (exact label text)
  const darkBtn = page.getByRole('button', { name: 'Dark' });
  await expect(darkBtn).toBeVisible({ timeout: 6000 });
  await darkBtn.click();

  // Verify dark class applied immediately to the html element
  await expect(page.locator('html')).toHaveClass(/dark/);

  // Verify Zustand persist wrote 'dark' preference to localStorage
  // (format: {"state":{"preference":"dark"},"version":0})
  const stored = await page.evaluate(() => localStorage.getItem('ptrack-theme'));
  expect(stored).toContain('dark');
});

test('language settings page is reachable when authenticated', async ({ page }) => {
  await loginAs(page, MOCK_CITIZEN);

  await page.route('**/api/v1/auth/me/', (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({ json: { ...MOCK_CITIZEN, preferred_language: 'fr' } });
    }
    return route.fulfill({ json: MOCK_CITIZEN });
  });

  await page.goto('/settings/language');

  // Page should load (not redirect to /login)
  await expect(page).toHaveURL(/settings\/language/, { timeout: 6000 });

  // The page should render something (heading or language options)
  await expect(page.locator('body')).toBeVisible();
});
