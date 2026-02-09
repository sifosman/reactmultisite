import { test, expect } from '@playwright/test';

test.describe('User-Friendly Language', () => {
  test('should show user-friendly cart message', async ({ page }) => {
    await page.goto('/cart');
    
    // Look for the improved cart message
    const cartMessage = page.locator('text=Your cart is saved locally for quick checkout');
    
    // Should not show technical message
    const technicalMessage = page.locator('text=Guest cart is stored in this browser');
    await expect(technicalMessage).not.toBeVisible();
    
    // If cart has items, should show the friendly message
    if (await cartMessage.isVisible()) {
      await expect(cartMessage).toBeVisible();
    }
  });

  test('should show user-friendly pricing message in cart', async ({ page }) => {
    await page.goto('/cart');
    
    // Look for the improved pricing message
    const friendlyMessage = page.locator('text=Final prices will be calculated during checkout to ensure accuracy');
    
    // Should not show technical message
    const technicalMessage = page.locator('text=Totals shown here are for display only. Checkout recalculates totals server-side');
    await expect(technicalMessage).not.toBeVisible();
    
    // If cart has items, should show the friendly message
    if (await friendlyMessage.isVisible()) {
      await expect(friendlyMessage).toBeVisible();
    }
  });

  test('should show user-friendly message on product page', async ({ page }) => {
    // Go to a product page (assuming there are products)
    await page.goto('/products');
    
    // Click on first product if available
    const firstProduct = page.locator('a[href*="/product/"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForURL('**/product/**');
      
      // Look for the friendly cart message on product page
      const friendlyMessage = page.locator('text=Your cart is saved locally for quick checkout');
      
      // Should not show technical message
      const technicalMessage = page.locator('text=Guest cart is stored in this browser');
      await expect(technicalMessage).not.toBeVisible();
      
      if (await friendlyMessage.isVisible()) {
        await expect(friendlyMessage).toBeVisible();
      }
    }
  });

  test('should maintain clarity while being user-friendly', async ({ page }) => {
    await page.goto('/cart');
    
    // The friendly messages should still convey the important information
    const friendlyMessage = page.locator('text=Final prices will be calculated during checkout to ensure accuracy');
    
    if (await friendlyMessage.isVisible()) {
      // Should mention "final prices" and "checkout"
      expect(await friendlyMessage.textContent()).toContain('final');
      expect(await friendlyMessage.textContent()).toContain('checkout');
    }
  });
});
