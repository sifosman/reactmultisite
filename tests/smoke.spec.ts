import { test, expect } from '@playwright/test';

// Basic smoke tests: layout, header/footer, navigation

test.describe('Smoke / layout', () => {
  test('home page renders with header and footer and no client errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      // Ignore known benign third-party cookie warnings from Supabase storage
      if (text.includes('Cookie “__cf_bm” has been rejected for invalid domain')) return;
      consoleErrors.push(text);
    });

    await page.goto('/');

    // Header brand / logo (scope to header to avoid footer duplicates)
    const header = page.locator('header');
    await expect(header.getByRole('link', { name: /^products$/i })).toBeVisible();

    // Footer (look for typical footer text by role or text content)
    // This is intentionally loose to avoid coupling to specific markup
    const footerText = page.getByText(/terms|contact|©|copyright/i).first();
    await expect(footerText).toBeVisible({ timeout: 10_000 });

    // Scroll to bottom to catch lazy-load/layout issues
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // No console errors after initial render
    expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
  });

  test('navigation via header works', async ({ page }) => {
    await page.goto('/');

    // Click Products in header nav
    const header = page.locator('header');
    await header.getByRole('link', { name: /^products$/i }).click();
    await expect(page).toHaveURL(/\/products/);

    // From products, go to categories via header
    await header.getByRole('link', { name: /^categories$/i }).click();
    await expect(page).toHaveURL(/\/categories/);
  });
});
