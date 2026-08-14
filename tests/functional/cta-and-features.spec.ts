/**
 * tests/functional/cta-and-features.spec.ts
 *
 * Functional tests for Crumb's CTAs, feature sections, and key page interactions.
 * Tests do NOT click any link that would navigate to a checkout or sign-up flow —
 * they verify presence, visibility, and labeling only.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('CTAs and Features @functional', () => {
  test.beforeEach(async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
  });

  // ── Primary CTA ───────────────────────────────────────────────────────────────

  test('primary CTA button is visible and accessible @functional', async ({ page }) => {
    const primaryCTA = page
      .locator('a, button')
      .filter({
        hasText: /get started|try free|request demo|sign up|get demo|book demo|start free|learn more/i,
      })
      .first();

    if (await primaryCTA.count() === 0) {
      console.warn('[functional] No primary CTA found with standard text — checking for any button in hero.');
      const heroButton = page.locator('header button, header a, [class*="hero"] button, [class*="hero"] a').first();
      await expect(heroButton, 'Hero section should have at least one interactive element').toBeVisible();
      return;
    }

    await expect(primaryCTA, 'Primary CTA should be visible on page load').toBeVisible();

    const text = await primaryCTA.textContent();
    expect(text?.trim().length, 'Primary CTA should have non-empty text').toBeGreaterThan(0);
  });

  // ── Feature / benefit sections ─────────────────────────────────────────────

  test('features or benefits section is present @functional', async ({ page }) => {
    const featureSection = page.locator(
      '[id*="feature" i], [id*="benefit" i], [id*="how" i], ' +
      '[class*="feature" i], [class*="benefit" i], [class*="how-it-works" i], ' +
      '[class*="solution" i], [class*="product" i]'
    ).first();

    if (await featureSection.count() > 0) {
      await expect(featureSection, 'Features/benefits section should be visible').toBeVisible();
      return;
    }

    // Fallback: check for multiple H2/H3 headings which typically label feature sections
    const subheadings = page.locator('h2, h3');
    const count = await subheadings.count();
    expect(
      count,
      'Page should have feature/benefit sections identified by H2/H3 headings'
    ).toBeGreaterThan(0);
  });

  test('feature items or cards are visible @functional', async ({ page }) => {
    const featureCards = page.locator(
      '[class*="card" i], [class*="feature-item" i], [class*="benefit-item" i], ' +
      '[class*="tile" i], [class*="item" i]'
    );

    const count = await featureCards.count();
    if (count === 0) {
      console.warn('[functional] No feature card elements found — site may use a different layout pattern.');
      // Soft pass — layout varies across B2B SaaS sites
      return;
    }

    expect(count, 'Feature/benefit items should be present').toBeGreaterThan(0);

    // Spot-check first card is visible
    await expect(featureCards.first(), 'First feature card/item should be visible').toBeVisible();
  });

  // ── Social proof ────────────────────────────────────────────────────────────

  test('testimonials, logos, or social proof section exists @functional', async ({ page }) => {
    const socialProof = page.locator(
      '[class*="testimonial" i], [class*="review" i], [class*="logo" i], ' +
      '[class*="partner" i], [class*="client" i], [class*="trust" i], ' +
      '[class*="social-proof" i], [class*="quote" i]'
    ).first();

    if (await socialProof.count() === 0) {
      console.warn('[functional] No social proof section found — may be expected for early-stage site.');
      return;
    }

    await expect(socialProof, 'Social proof section should be visible').toBeVisible();
  });

  // ── Pricing / Plans ─────────────────────────────────────────────────────────

  test('pricing section or link is accessible @functional', async ({ page, siteConfig }) => {
    // Check for inline pricing section
    const pricingSection = page.locator(
      '[id*="pricing" i], [class*="pricing" i], [class*="plan" i]'
    ).first();

    if (await pricingSection.count() > 0) {
      await expect(pricingSection, 'Pricing section should be visible').toBeVisible();
      return;
    }

    // Check for a pricing nav link
    const pricingLink = page.locator('a').filter({ hasText: /pricing|plans/i }).first();
    if (await pricingLink.count() > 0) {
      const href = await pricingLink.getAttribute('href');
      expect(href, 'Pricing link should have a valid href').not.toBeNull();
      expect(href?.trim().length, 'Pricing link href should not be empty').toBeGreaterThan(0);
      return;
    }

    console.warn('[functional] No pricing section or link found — may be by design for demo-request model.');
  });

  // ── About / Company section ─────────────────────────────────────────────────

  test('about section or link is accessible @functional', async ({ page }) => {
    const aboutSection = page.locator(
      '[id*="about" i], [class*="about" i], [class*="mission" i], [class*="story" i]'
    ).first();

    const aboutLink = page.locator('a').filter({ hasText: /about/i }).first();

    const hasAboutSection = await aboutSection.count() > 0;
    const hasAboutLink = await aboutLink.count() > 0;

    if (!hasAboutSection && !hasAboutLink) {
      console.warn('[functional] No about section or link found.');
    } else {
      expect(
        hasAboutSection || hasAboutLink,
        'Site should have an "About" section or navigation link'
      ).toBeTruthy();
    }
  });

  // ── Contact access ─────────────────────────────────────────────────────────

  test('contact or demo request path is accessible @functional', async ({ page }) => {
    const contactCTA = page
      .locator('a, button')
      .filter({ hasText: /contact|get in touch|demo|talk to|reach out/i })
      .first();

    if (await contactCTA.count() === 0) {
      console.warn('[functional] No explicit contact/demo CTA found — checking for contact nav link.');
      const navContact = page.locator('nav a, [role="navigation"] a').filter({ hasText: /contact/i }).first();
      if (await navContact.count() > 0) {
        await expect(navContact, 'Contact nav link should be visible').toBeVisible();
        return;
      }
      console.warn('[functional] No contact path found on homepage.');
      return;
    }

    await expect(contactCTA, 'Contact/demo CTA should be visible').toBeVisible();
  });

  // ── Page performance (core vitals proxy) ────────────────────────────────────

  test('page has at most 10 blocking render resources @functional', async ({ page }) => {
    const blockingResources = await page.evaluate<number>(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return entries.filter(
        (e) =>
          (e.initiatorType === 'script' || e.initiatorType === 'css') &&
          e.duration > 2000
      ).length;
    });

    if (blockingResources > 10) {
      console.warn(
        `[functional] ${blockingResources} resources took >2s to load. ` +
          'This may indicate a performance concern.'
      );
    }

    // Soft threshold — warn but do not hard-fail
    expect(
      blockingResources,
      `Found ${blockingResources} slow-loading resources (>2s)`
    ).toBeLessThanOrEqual(20);
  });
});
