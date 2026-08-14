/**
 * tests/functional/homepage.spec.ts
 *
 * Functional tests for the Crumb homepage (https://crumbraise.com).
 * Covers: hero section, headings, CTAs, key content sections.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('Homepage Functional @functional', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.navigate();
    await homePage.waitForLoad();
  });

  // ── Page load ────────────────────────────────────────────────────────────────

  test('homepage loads with visible content @functional @smoke', async ({ homePage }) => {
    const isLoaded = await homePage.isLoaded();
    expect(isLoaded, 'Homepage should have headings, nav, and body text').toBeTruthy();
  });

  // ── Hero / heading ───────────────────────────────────────────────────────────

  test('homepage has an H1 heading @functional', async ({ page }) => {
    const h1 = page.locator('h1').first();
    await expect(h1, 'Homepage should have a primary H1 heading').toBeVisible();

    const text = await h1.textContent();
    expect(text?.trim().length, 'H1 heading should have meaningful text').toBeGreaterThan(3);
  });

  test('hero section is visible above the fold @functional', async ({ homePage }) => {
    const heroText = await homePage.getHeroText();
    expect(heroText.length, 'Hero/banner section should have visible text content').toBeGreaterThan(5);
  });

  // ── CTAs ─────────────────────────────────────────────────────────────────────

  test('homepage has at least one call-to-action button or link @functional', async ({
    homePage,
  }) => {
    const ctaButtons = await homePage.getCTAButtons();
    expect(
      ctaButtons.length,
      'Homepage should have at least one CTA button or link (e.g. "Get Started", "Try Free")'
    ).toBeGreaterThan(0);
  });

  test('CTA buttons are visible and have non-empty text @functional', async ({ homePage }) => {
    const ctaButtons = await homePage.getCTAButtons();

    if (ctaButtons.length === 0) {
      console.warn('[functional] No CTA buttons found on homepage — skipping text check.');
      return;
    }

    for (const cta of ctaButtons.slice(0, 5)) {
      const isVisible = await cta.isVisible();
      if (!isVisible) continue;

      const text = await cta.textContent();
      expect(
        text?.trim().length,
        `CTA button/link should have visible text, found: "${text}"`
      ).toBeGreaterThan(0);
    }
  });

  // ── Sections ─────────────────────────────────────────────────────────────────

  test('homepage has multiple content sections @functional', async ({ page }) => {
    const sections = page.locator('section, [class*="section"], main > div');
    const count = await sections.count();
    expect(
      count,
      'Homepage should have at least 2 distinct content sections'
    ).toBeGreaterThan(1);
  });

  test('page has descriptive subheadings (H2 or H3) @functional', async ({ page }) => {
    const subheadings = page.locator('h2, h3');
    const count = await subheadings.count();
    expect(
      count,
      'Homepage should have H2 or H3 subheadings describing features/sections'
    ).toBeGreaterThan(0);
  });

  // ── Footer ───────────────────────────────────────────────────────────────────

  test('footer is present on homepage @functional', async ({ page }) => {
    const footer = page.locator('footer, [role="contentinfo"]').first();
    await expect(footer, 'Page should have a footer element').toBeVisible();
  });

  test('footer has links @functional', async ({ page }) => {
    const footerLinks = page.locator('footer a, [role="contentinfo"] a');
    const count = await footerLinks.count();
    expect(count, 'Footer should contain at least one link').toBeGreaterThan(0);
  });

  // ── Images ───────────────────────────────────────────────────────────────────

  test('hero images load without broken src @functional', async ({ page }) => {
    const brokenImages = await page.evaluate<string[]>(() => {
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
      return imgs
        .filter((img) => {
          const rect = img.getBoundingClientRect();
          // Only check images that are in or near the viewport
          return rect.top < window.innerHeight * 2 && !img.complete;
        })
        .map((img) => img.src);
    });

    if (brokenImages.length > 0) {
      console.warn('[functional] Potentially incomplete images:\n  ' + brokenImages.join('\n  '));
    }

    // Wait for images to load and check naturalWidth
    const zeroSizeImages = await page.evaluate<string[]>(() => {
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('header img, [class*="hero"] img, [class*="banner"] img'));
      return imgs
        .filter((img) => img.complete && img.naturalWidth === 0 && img.src.length > 0)
        .map((img) => img.src);
    });

    expect(
      zeroSizeImages,
      `Hero images with zero naturalWidth (broken): ${zeroSizeImages.join(', ')}`
    ).toHaveLength(0);
  });
});
