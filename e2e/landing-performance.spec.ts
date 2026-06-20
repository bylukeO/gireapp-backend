// ─────────────────────────────────────────────────
// GIREAPP — Landing Page Performance Tests
// AC-3: LCP < 2.5s on simulated 4G connection
// Uses Chrome DevTools Protocol for Web Vitals
// ─────────────────────────────────────────────────

import { test, expect } from '@playwright/test';

// Only run performance tests on desktop viewport to avoid flaky mobile perf
test.describe('Landing Page — Performance (AC-3)', () => {
  // Simulated "Good 4G" network conditions
  const GOOD_4G = {
    offline: false,
    downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps
    uploadThroughput: (3 * 1024 * 1024) / 8,   // 3 Mbps
    latency: 20,                                // 20ms RTT
  };

  test('LCP is under 2.5 seconds on simulated 4G', async ({ page, context, browserName }) => {
    // Only run on Chromium (CDP required)
    test.skip(browserName !== 'chromium', 'CDP-based performance test only runs on Chromium');

    // Set up CDP session for network throttling
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Network.emulateNetworkConditions', GOOD_4G);

    // Use addInitScript so the observer is set up BEFORE the page loads
    await page.addInitScript(() => {
      (window as any).__LCP_VALUE = 0;
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        (window as any).__LCP_VALUE = lastEntry.startTime;
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Give LCP observer time to fire
    await page.waitForTimeout(1000);

    const lcp = await page.evaluate(() => (window as any).__LCP_VALUE as number);

    // AC-3: LCP must be under 2500ms
    expect(lcp).toBeGreaterThan(0); // Ensure it actually measured something
    expect(lcp).toBeLessThan(2500);

    // Log for CI visibility
    console.log(`✅ Landing Page LCP: ${Math.round(lcp)}ms (target: <2500ms)`);

    // Cleanup
    await cdpSession.detach();
  });

  test('no layout shifts during initial load', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CLS measurement only runs on Chromium');

    // Use addInitScript so the observer is set up BEFORE the page loads
    await page.addInitScript(() => {
      (window as any).__CLS_VALUE = 0;
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            (window as any).__CLS_VALUE += (entry as any).value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    const cls = await page.evaluate(() => (window as any).__CLS_VALUE as number);

    // Good CLS is < 0.1 (Google Web Vitals threshold)
    expect(cls).toBeLessThan(0.1);

    console.log(`✅ Landing Page CLS: ${cls.toFixed(4)} (target: <0.1)`);
  });
});
