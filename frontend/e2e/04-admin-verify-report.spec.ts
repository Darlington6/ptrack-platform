/**
 * Journey 4: Admin opens pending report → clicks Verify → sees confirmation modal → confirms
 */
import { test, expect } from '@playwright/test';
import { loginAs, MOCK_ADMIN } from './helpers';

const PENDING_REPORT = {
  id: 7,
  waste_type: 'plastic',
  description: 'Large pile near bus stop',
  latitude: -1.9441,
  longitude: 30.0619,
  status: 'pending',
  rejection_reason: '',
  created_at: new Date().toISOString(),
  user: 10,
  user_detail: { full_name: 'Jane Doe', email: 'jane@example.com', username: 'jane' },
  image: null,
};

test('admin verifies a pending report through the detail page', async ({ page }) => {
  await loginAs(page, MOCK_ADMIN);

  // Use regex — glob patterns can be unreliable for exact path segments
  await page.route(/\/api\/v1\/reports\/7\//, (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({ json: { ...PENDING_REPORT, status: 'verified' } });
    }
    return route.fulfill({ json: PENDING_REPORT });
  });

  // Stub Maps SDK so the page doesn't hang waiting for Google Maps
  await page.route('**/maps.googleapis.com/**', (route) => route.abort());

  await page.goto('/reports/7');

  // Verify button visible for admin on a pending report
  const verifyBtn = page.getByRole('button', { name: /verify report/i });
  await expect(verifyBtn).toBeVisible({ timeout: 8000 });
  await verifyBtn.click();

  // Confirmation modal appears
  await expect(page.getByText(/verify this report/i)).toBeVisible({ timeout: 3000 });

  // Confirm — button text is exactly "Verify"
  await page.getByRole('button', { name: /^verify$/i }).click();

  // Success toast — use "citizen awarded" to avoid matching the "Verified" status badge
  await expect(page.getByText(/citizen awarded/i)).toBeVisible({ timeout: 5000 });
});
