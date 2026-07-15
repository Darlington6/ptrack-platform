/**
 * Journey 5: Activity history shows reports; offline mode doesn't crash the app
 */
import { test, expect } from '@playwright/test';
import { loginAs, MOCK_CITIZEN } from './helpers';

const MOCK_REPORT = {
  id: 99,
  waste_type: 'bottles', // 'plastic' has no i18n key; 'bottles' → t('report:bottles') = "Plastic Bottles"
  description: 'Plastic bags near road',
  latitude: -1.9441,
  longitude: 30.0619,
  status: 'pending',
  rejection_reason: '',
  created_at: new Date().toISOString(),
  user: MOCK_CITIZEN.id,
  user_detail: null,
  image: null,
};

test('activity page shows submitted reports', async ({ page }) => {
  await loginAs(page, MOCK_CITIZEN);

  // MyActivity fetches /rewards/, /reports/?user=me, and /recycling/
  await page.route('**/api/v1/rewards/**', (route) =>
    route.fulfill({ json: { results: [], count: 0 } })
  );
  await page.route('**/api/v1/reports/**', (route) =>
    route.fulfill({ json: { results: [MOCK_REPORT], count: 1 } })
  );
  await page.route('**/api/v1/recycling/**', (route) =>
    route.fulfill({ json: { results: [], count: 0 } })
  );

  await page.goto('/activity');

  // MyActivity renders items as t('report:waste_type') — 'bottles' → "Plastic Bottles"
  await expect(page.getByText(/Plastic Bottles/i)).toBeVisible({ timeout: 8000 });
});

test('app remains usable after going offline', async ({ page, context }) => {
  await loginAs(page, MOCK_CITIZEN);

  // Mock everything so the dashboard loads fully first
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({ json: { results: [], count: 0, points: 80 } })
  );

  await page.goto('/dashboard');

  // Wait for the page to be fully loaded before going offline
  await expect(page.locator('body')).toBeVisible();

  // Simulate going offline
  await context.setOffline(true);

  // The already-loaded page should still render without a crash
  const body = page.locator('body');
  await expect(body).toBeVisible();

  // Check there's no full error boundary (no "Something went wrong" or blank screen)
  const errorText = page.getByText(/something went wrong|fatal error/i);
  await expect(errorText).not.toBeVisible();

  await context.setOffline(false);
});
