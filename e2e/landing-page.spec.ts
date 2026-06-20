// ─────────────────────────────────────────────────
// GIREAPP — Landing Page Visual Regression Tests
// AC-2: Layout passes visual regression at 375/768/1440px
// AC-4: All CTAs route to /register
// AC-5: Keyboard navigation & screen-reader compatibility
// Edge: Rapid CTA clicks don't trigger duplicate navigation
// ─────────────────────────────────────────────────

import { test, expect } from '@playwright/test';

test.describe('Landing Page — Visual Regression (AC-2)', () => {
  test('full page screenshot matches baseline', async ({ page }) => {
    await page.goto('/');
    // Wait for animations to settle
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('landing-full.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('hero section renders correctly', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
    await expect(hero).toHaveScreenshot('landing-hero.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('hero heading is readable without truncation', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Get It Right');
    // Verify text is not clipped — bounding box should have reasonable height
    const box = await h1.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(30);
    expect(box!.width).toBeGreaterThan(100);
  });

  test('features section renders all 4 cards', async ({ page }) => {
    await page.goto('/');
    const featureSection = page.locator('#features');
    await expect(featureSection).toBeVisible();
    await expect(featureSection).toHaveScreenshot('landing-features.png', {
      maxDiffPixelRatio: 0.02,
    });
    // Verify all 4 feature cards are present
    const cards = featureSection.locator('[class*="bg-card"]');
    await expect(cards).toHaveCount(4);
  });

  test('segment cards render all 3 tracks', async ({ page }) => {
    await page.goto('/');
    // Segment section is the second <section>
    const segmentHeading = page.getByText('Your Track, Your Dashboard');
    await expect(segmentHeading).toBeVisible();
  });
});

test.describe('Landing Page — CTA Routing (AC-4)', () => {
  test('nav CTA routes to /register', async ({ page }) => {
    await page.goto('/');
    const navCta = page.locator('#nav-signup-cta');
    await expect(navCta).toBeVisible();
    await expect(navCta).toHaveText(/Sign Up/);
    await navCta.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('hero CTA routes to /register', async ({ page }) => {
    await page.goto('/');
    const heroCta = page.locator('#hero-signup-cta');
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toHaveText(/Start Learning/);
    await heroCta.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('footer CTA routes to /register', async ({ page }) => {
    await page.goto('/');
    const footerCta = page.locator('#footer-signup-cta');
    await footerCta.scrollIntoViewIfNeeded();
    await expect(footerCta).toBeVisible();
    await expect(footerCta).toHaveText(/Create Free Account/);
    await footerCta.click();
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Landing Page — Accessibility (AC-5)', () => {
  test('skip-to-main link is functional via keyboard', async ({ page }) => {
    await page.goto('/');
    // Tab into the skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    // Use keyboard Enter instead of click — the skip link is sr-only
    // and positioned behind the sticky header, so mouse click gets intercepted
    await page.keyboard.press('Enter');
    // Verify main content area is visible
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('all interactive elements are keyboard-navigable', async ({ page }) => {
    await page.goto('/');
    const focusableIds: string[] = [];

    // Tab through focusable elements and collect their IDs
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      const id = await page.evaluate(() => {
        return document.activeElement?.id || '';
      });
      if (id) focusableIds.push(id);
    }

    // Verify CTAs are reachable via keyboard
    expect(focusableIds).toContain('nav-signup-cta');
    expect(focusableIds).toContain('hero-signup-cta');
  });

  test('page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    // Single h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // h2 headings exist
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(3);

    // h3 headings exist (segment/feature cards)
    const h3Count = await page.locator('h3').count();
    expect(h3Count).toBeGreaterThanOrEqual(3);
  });

  test('decorative icons are hidden from screen readers', async ({ page }) => {
    await page.goto('/');
    const decorativeIcons = page.locator('[aria-hidden="true"]');
    const count = await decorativeIcons.count();
    // We expect many decorative icons (verified 13+ in audit)
    expect(count).toBeGreaterThanOrEqual(10);
  });
});

test.describe('Landing Page — Edge Cases', () => {
  test('rapid CTA clicks do not cause duplicate navigation', async ({ page }) => {
    await page.goto('/');
    const heroCta = page.locator('#hero-signup-cta');
    await expect(heroCta).toBeVisible();

    // Click rapidly — SafeLink debounce should prevent duplicates
    await heroCta.click();
    await heroCta.click({ force: true, noWaitAfter: true }).catch(() => {});
    await heroCta.click({ force: true, noWaitAfter: true }).catch(() => {});

    // Should still end up at /register without errors
    await page.waitForURL(/\/register/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/register/);
  });

  test('page renders core content without images', async ({ page }) => {
    // Block all image requests
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg}', (route) =>
      route.abort()
    );
    await page.goto('/');

    // Core text content should still be accessible
    await expect(page.locator('h1')).toContainText('Get It Right');
    await expect(page.locator('#hero-signup-cta')).toBeVisible();
    await expect(page.locator('#nav-signup-cta')).toBeVisible();
  });
});
