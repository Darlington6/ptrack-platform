/**
 * Journey 1: Landing page → Login page → authenticated dashboard
 */
import { test, expect } from '@playwright/test';
import { loginAs, MOCK_CITIZEN } from './helpers';

test('landing page has a Login CTA that goes to /login', async ({ page }) => {
  // Unauthenticated — /auth/me/ should 401
  await page.route('**/api/v1/auth/me/', (route) =>
    route.fulfill({ status: 401, json: { detail: 'Unauthorized' } })
  );

  await page.goto('/');

  // The landing page has two CTAs: "Get Started" → /register, "Login" → /login
  const loginLink = page.getByRole('link', { name: /^login$/i });
  await expect(loginLink).toBeVisible();
  await loginLink.click();
  await expect(page).toHaveURL(/\/login/);
});

test('login with valid credentials redirects to dashboard', async ({ page }) => {
  // In Playwright, LAST-registered route takes precedence.
  // Register the catch-all FIRST so specific routes below override it.
  await page.route('**/api/v1/**', (route) => route.fulfill({ json: { results: [], count: 0 } }));

  // loginAs registered AFTER catch-all → /auth/me/ takes precedence over it
  await loginAs(page, MOCK_CITIZEN);

  // login endpoint registered LAST → highest priority
  await page.route('**/api/v1/auth/login/', (route) =>
    route.fulfill({
      json: {
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        user: MOCK_CITIZEN,
      },
    })
  );

  await page.goto('/login');

  // Fill the form — email field has name="identifier", password has type="password"
  await page.locator('[name="identifier"]').fill('citizen@example.com');
  await page.locator('[type="password"]').fill('testpass123');
  await page.locator('[type="submit"]').click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
});
