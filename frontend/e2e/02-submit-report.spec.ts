/**
 * Journey 2: Citizen submits a waste report → sees success toast
 */
import { test, expect } from '@playwright/test';
import { loginAs, MOCK_CITIZEN } from './helpers';

test('citizen can submit a waste report and see confirmation', async ({ page }) => {
  await loginAs(page, MOCK_CITIZEN);

  // Mock geolocation before navigation
  await page.context().setGeolocation({ latitude: -1.9441, longitude: 30.0619 });
  await page.context().grantPermissions(['geolocation']);

  // Mock all API calls the ReportWaste page needs
  await page.route('**/api/v1/point-configs/', (route) =>
    route.fulfill({ json: { report_submitted: 10, verification_bonus: 10 } })
  );
  await page.route('**/api/v1/reports/', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        json: {
          id: 42,
          waste_type: 'plastic',
          description: 'Plastic bags near the road',
          latitude: -1.9441,
          longitude: 30.0619,
          status: 'pending',
          rejection_reason: '',
          created_at: new Date().toISOString(),
          user: MOCK_CITIZEN.id,
        },
      });
    }
    return route.fulfill({ json: { results: [], count: 0 } });
  });
  await page.route('**/api/v1/rewards/', (route) =>
    route.fulfill({ json: { results: [], count: 0 } })
  );

  await page.goto('/report');

  // Submit button is "Submit Report"
  const submitBtn = page.getByRole('button', { name: /submit report/i });
  await expect(submitBtn).toBeVisible({ timeout: 8000 });
  await submitBtn.click();

  // Success toast message contains the points awarded
  await expect(page.getByText(/submitted|success|\+10/i)).toBeVisible({ timeout: 8000 });
});
