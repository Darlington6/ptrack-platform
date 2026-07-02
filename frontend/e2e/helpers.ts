import { Page } from '@playwright/test';

export const MOCK_CITIZEN = {
  id: 1,
  username: 'testcitizen',
  email: 'citizen@example.com',
  full_name: 'Test Citizen',
  role: 'citizen',
  is_active: true,
  email_verified: true,
  has_completed_onboarding: true,
  sector: 'Kimironko',
  points: 80,
  bio: '',
  preferred_language: 'en',
  theme_preference: 'system',
};

export const MOCK_ADMIN = {
  id: 2,
  username: 'testadmin',
  email: 'admin@example.com',
  full_name: 'Test Admin',
  role: 'admin',
  is_active: true,
  email_verified: true,
  has_completed_onboarding: true,
  sector: 'Kacyiru',
  points: 0,
  bio: '',
  preferred_language: 'en',
  theme_preference: 'system',
};

const ACCESS = 'mock-access-token';
const REFRESH = 'mock-refresh-token';

/**
 * Sets up auth mocking for a test:
 * 1. Injects tokens into localStorage via addInitScript (runs before any page code)
 * 2. Registers route mocks for /auth/me/ and /auth/refresh/
 *
 * Call this BEFORE page.goto() in each test. The function does NOT navigate.
 */
export async function loginAs(page: Page, user: typeof MOCK_CITIZEN) {
  // addInitScript runs before any JS on the page — so tokens and consent exist
  // when AuthContext's useEffect fires and looks for access_token.
  await page.addInitScript(
    (tokens: string[]) => {
      localStorage.setItem('access_token', tokens[0] ?? '');
      localStorage.setItem('refresh_token', tokens[1] ?? '');
      // Pre-grant geolocation consent so GeoConsentModal never blocks the report page
      localStorage.setItem('ptrack_geo_consent', 'allowed');
    },
    [ACCESS, REFRESH]
  );

  // Route mocks must be registered before navigation too.
  await page.route('**/api/v1/auth/me/', (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({ json: { ...user } });
    }
    return route.fulfill({ json: user });
  });

  await page.route('**/api/v1/auth/refresh/', (route) =>
    route.fulfill({ json: { access: ACCESS } })
  );

  // nudgesApi.active() returns a plain array — the catch-all's { results: [] }
  // format would cause NudgeBanner to crash (can't call .slice on an object).
  await page.route('**/api/v1/nudges/**', (route) => route.fulfill({ json: [] }));
}
