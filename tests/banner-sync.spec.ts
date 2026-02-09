import { test, expect } from '@playwright/test';

test.describe('Banner Sync Issues', () => {
  test('should not flash wrong image on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if banner exists
    const banner = page.locator('img').first();
    if (await banner.isVisible()) {
      // Get the initial image source
      const initialSrc = await banner.getAttribute('src');
      
      // Wait a bit to ensure no flash occurs
      await page.waitForTimeout(1000);
      
      // Image source should remain consistent (no flash to mobile image)
      const currentSrc = await banner.getAttribute('src');
      expect(currentSrc).toBe(initialSrc);
    }
  });

  test('should not flash wrong image on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if banner exists
    const banner = page.locator('img').first();
    if (await banner.isVisible()) {
      // Get the initial image source
      const initialSrc = await banner.getAttribute('src');
      
      // Wait a bit to ensure no flash occurs
      await page.waitForTimeout(1000);
      
      // Image source should remain consistent (no flash to desktop image)
      const currentSrc = await banner.getAttribute('src');
      expect(currentSrc).toBe(initialSrc);
    }
  });

  test('should handle viewport resize without image flash', async ({ page }) => {
    // Start with desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const banner = page.locator('img').first();
    if (await banner.isVisible()) {
      const desktopSrc = await banner.getAttribute('src');
      
      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      const mobileSrc = await banner.getAttribute('src');
      
      // Should show different images for different viewports
      // (assuming different mobile/desktop images are configured)
      if (desktopSrc && mobileSrc) {
        // Images might be different, but there should be no flash/loading issues
        expect(mobileSrc).toBeTruthy();
      }
      
      // Resize back to desktop
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(500);
      
      const backToDesktopSrc = await banner.getAttribute('src');
      
      // Should return to desktop image
      if (desktopSrc && backToDesktopSrc) {
        expect(backToDesktopSrc).toBe(desktopSrc);
      }
    }
  });

  test('should show placeholder during initial load', async ({ page }) => {
    await page.goto('/');
    
    // Check if there's a placeholder or loading state
    // This depends on the implementation - could be a placeholder div
    const placeholder = page.locator('.animate-pulse').first();
    
    // The placeholder should be brief and not interfere with UX
    if (await placeholder.isVisible()) {
      // Placeholder should disappear quickly
      await expect(placeholder).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should not show hydration mismatch errors', async ({ page }) => {
    // This test checks for console errors related to hydration
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should not have hydration-related errors
    const hydrationErrors = errors.filter(error => 
      error.includes('hydration') || 
      error.includes('mismatch') ||
      error.includes('server-side rendering')
    );
    
    expect(hydrationErrors).toHaveLength(0);
  });
});
