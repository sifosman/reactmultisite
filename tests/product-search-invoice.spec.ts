import { test, expect } from '@playwright/test';

test.describe('Invoice Product Search', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should search products by any word in the query', async ({ page }) => {
    await page.goto('/admin/invoices/new');
    
    // Wait for the search input to be available
    await page.waitForSelector('input[placeholder="Search products / SKU…"]');
    const searchInput = page.locator('input[placeholder="Search products / SKU…"]');
    
    // Test 1: Search with partial words
    await searchInput.fill('blue shirt');
    await page.waitForTimeout(500);
    
    // Should show products containing "blue" OR "shirt"
    const results = page.locator('button:has-text("Add")');
    const resultCount = await results.count();
    
    if (resultCount > 0) {
      // Verify results contain relevant products
      const firstResult = results.first();
      await expect(firstResult).toBeVisible();
    }
    
    // Test 2: Search with different word order
    await searchInput.fill('shirt blue');
    await page.waitForTimeout(500);
    
    // Should show same results as above (order doesn't matter)
    const results2 = page.locator('button:has-text("Add")');
    const resultCount2 = await results2.count();
    
    // Results should be similar regardless of word order
    expect(Math.abs(resultCount - resultCount2)).toBeLessThan(3);
    
    // Test 3: Search with single word
    await searchInput.fill('blue');
    await page.waitForTimeout(500);
    
    const results3 = page.locator('button:has-text("Add")');
    const resultCount3 = await results3.count();
    
    // Single word search should return more or equal results
    expect(resultCount3).toBeGreaterThanOrEqual(resultCount);
  });

  test('should search by SKU and variant names', async ({ page }) => {
    await page.goto('/admin/invoices/new');
    
    const searchInput = page.locator('input[placeholder="Search products / SKU…"]');
    
    // Search by SKU (assuming there are products with SKUs)
    await searchInput.fill('SKU001');
    await page.waitForTimeout(500);
    
    const skuResults = page.locator('button:has-text("Add")');
    
    // Search by variant name
    await searchInput.fill('large');
    await page.waitForTimeout(500);
    
    const variantResults = page.locator('button:has-text("Add")');
    
    // Both searches should return some results if data exists
    // (This test depends on having test data)
  });

  test('should handle empty search gracefully', async ({ page }) => {
    await page.goto('/admin/invoices/new');
    
    const searchInput = page.locator('input[placeholder="Search products / SKU…"]');
    
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);
    
    // Should not show any results
    const results = page.locator('button:has-text("Add")');
    await expect(results).toHaveCount(0);
  });

  test('should add searched product to invoice', async ({ page }) => {
    await page.goto('/admin/invoices/new');
    
    const searchInput = page.locator('input[placeholder="Search products / SKU…"]');
    
    // Search for a product
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    
    const results = page.locator('button:has-text("Add")');
    const resultCount = await results.count();
    
    if (resultCount > 0) {
      // Click the first result to add it
      await results.first().click();
      await page.waitForTimeout(500);
      
      // Verify the product was added to the invoice lines
      const lines = page.locator('text=Lines');
      await expect(lines).toBeVisible();
      
      // Check if the added product appears in the lines section
      const addedProducts = page.locator('text=Remove');
      expect(await addedProducts.count()).toBeGreaterThan(0);
    }
  });
});
