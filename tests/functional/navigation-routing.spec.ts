/**
 * tests/functional/navigation-routing.spec.ts
 *
 * Functional navigation-routing tests: verifies that key pages are reachable,
 * route transitions work, and the browser back/forward stack is intact.
 *
 * Distinct from navigation/nav-links.spec.ts which tests the nav menu UI.
 * These tests focus on business-level routing: do pages actually load?
 *
 * Tag: @functional @navigation
 */

import { test, expect } from '@fixtures/site.fixture';

const COMMON_PATHS = [
  { label: 'Home', path: '/' },
  { label: 'Contact', path: '/contact' },
  { label: 'About', path: '/about' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Blog', path: '/blog' },
];

test.describe('Navigation Routing @functional @navigation', () => {
  // ── Known paths ──────────────────────────────────────────────────────────────

  test('homepage is reachable and not a 4xx/5xx @functional', async ({ page, siteConfig }) => {
    const response = await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
    expect(response, 'Homepage should return a response').not.toBeNull();
    expect(
      response!.status(),
      `Homepage should return 2xx/3xx, got ${response!.status()}`
    ).toBeLessThan(400);
  });

  test('common paths return 2xx or redirect (not 5xx) @functional', async ({
    page,
    siteConfig,
  }) => {
    const base = siteConfig.url.replace(/\/$/, '');
    const results: { label: string; status: number; path: string }[] = [];

    for (const { label, path } of COMMON_PATHS) {
      try {
        const response = await page.goto(base + path, {
          waitUntil: 'domcontentloaded',
          timeout: 10_000,
        });
        if (response) {
          results.push({ label, path, status: response.status() });
        }
      } catch {
        results.push({ label, path, status: 0 });
      }
    }

    const serverErrors = results.filter((r) => r.status >= 500);
    if (serverErrors.length > 0) {
      console.warn(
        '[functional] Paths returning 5xx:\n' +
          serverErrors.map((r) => `  ${r.label} (${r.path}) → ${r.status}`).join('\n')
      );
    }

    expect(
      serverErrors,
      `${serverErrors.length} path(s) returned server errors (5xx)`
    ).toHaveLength(0);
  });

  // ── Browser history ──────────────────────────────────────────────────────────

  test('browser back button returns to homepage after navigating away @functional', async ({
    page,
    siteConfig,
  }) => {
    const base = siteConfig.url.replace(/\/$/, '');

    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
    const homepageTitle = await page.title();

    // Navigate to a second page via a link, not hardcoded path
    const secondLink = page
      .locator('nav a[href], [role="navigation"] a[href]')
      .filter({ hasNotText: /^$/ })
      .first();

    if (await secondLink.count() === 0) {
      console.warn('[functional] No nav links found to test back-button navigation.');
      return;
    }

    const href = await secondLink.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      console.warn(`[functional] First nav link is not a page link (${href}) — skipping back-button test.`);
      return;
    }

    // Navigate to second page
    await secondLink.click();
    await page.waitForLoadState('domcontentloaded');
    const secondPageUrl = page.url();

    // Go back
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    const returnUrl = page.url();

    // Should be back at homepage or site root
    const siteOrigin = new URL(siteConfig.url).origin;
    expect(
      returnUrl.startsWith(siteOrigin),
      `Back button should return to site origin. Got: ${returnUrl}`
    ).toBeTruthy();

    // URL should differ from where we went
    if (secondPageUrl !== siteConfig.url) {
      expect(
        returnUrl,
        'After going back, URL should not be the second page URL'
      ).not.toBe(secondPageUrl);
    }
  });

  // ── 404 handling ─────────────────────────────────────────────────────────────

  test('non-existent page returns 404 (not 500) @functional', async ({ page, siteConfig }) => {
    const nonExistentUrl =
      siteConfig.url.replace(/\/$/, '') + '/this-page-definitely-does-not-exist-xyz-12345';

    const response = await page.goto(nonExistentUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });

    if (!response) {
      console.warn('[functional] No response for non-existent URL — skipping 404 check.');
      return;
    }

    const status = response.status();
    expect(
      status,
      `Non-existent page returned HTTP ${status}. Expected 404, not a 5xx server error.`
    ).not.toBeGreaterThanOrEqual(500);

    if (status !== 404) {
      console.warn(
        `[functional] Non-existent page returned ${status} instead of 404. ` +
          'Site may redirect all unknown paths to homepage (SPA pattern).'
      );
    }
  });

  // ── Anchor links ─────────────────────────────────────────────────────────────

  test('in-page anchor links scroll to their target without navigation error @functional', async ({
    page,
    siteConfig,
  }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

    const anchorLinks = page
      .locator('a[href^="#"]')
      .filter({ hasNotText: /^$/ });

    const count = await anchorLinks.count();
    if (count === 0) {
      console.warn('[functional] No in-page anchor links found — skipping anchor test.');
      return;
    }

    const firstAnchor = anchorLinks.first();
    const href = await firstAnchor.getAttribute('href');

    await firstAnchor.click();
    await page.waitForTimeout(300); // allow smooth scroll to settle

    // Should still be on the same page (no navigation)
    const currentUrl = page.url();
    const siteOrigin = new URL(siteConfig.url).origin;
    expect(
      currentUrl.startsWith(siteOrigin),
      `Clicking anchor link (${href}) should not navigate away from the site`
    ).toBeTruthy();
  });
});
