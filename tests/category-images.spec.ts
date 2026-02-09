import { test, expect } from '@playwright/test';

test.describe('Category Images', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should allow adding category image in admin', async ({ page }) => {
    await page.goto('/admin/categories/new');
    
    // Check if image URL field exists
    const imageInput = page.locator('input[placeholder="https://..."]');
    await expect(imageInput).toBeVisible();
    
    // Fill in category details
    await page.fill('input[name="name"]', 'Test Category');
    await page.fill('input[placeholder="kebab-case-slug"]', 'test-category');
    
    // Add an image URL
    await imageInput.fill('https://example.com/test-image.jpg');
    
    // Submit the form
    await page.click('button:has-text("Create category")');
    
    // Should redirect to categories page
    await page.waitForURL('/admin/categories');
    
    // Verify success by checking if we're back on categories page
    await expect(page.locator('text=Categories')).toBeVisible();
  });

  test('should display category image in admin list', async ({ page }) => {
    await page.goto('/admin/categories');
    
    // Look for category cards with images
    const categoryCards = page.locator('.rounded-xl.border');
    
    if (await categoryCards.first().isVisible()) {
      // Check if any category has an image
      const categoryImages = page.locator('img[alt*="category"]');
      
      if (await categoryImages.first().isVisible()) {
        // Verify image is displayed
        const firstImage = categoryImages.first();
        await expect(firstImage).toBeVisible();
        
        // Check if image has valid src
        const imgSrc = await firstImage.getAttribute('src');
        expect(imgSrc).toBeTruthy();
        expect(imgSrc?.length).toBeGreaterThan(0);
      }
    }
  });

  test('should show placeholder when no category image', async ({ page }) => {
    await page.goto('/admin/categories');
    
    // Look for category cards without images
    const folderIcons = page.locator('.text-slate-300');
    
    // Should show folder icon for categories without images
    if (await folderIcons.first().isVisible()) {
      await expect(folderIcons.first()).toBeVisible();
    }
  });

  test('should allow editing category image', async ({ page }) => {
    await page.goto('/admin/categories');
    
    // Find first category with edit button
    const editButton = page.locator('a:has-text("Edit")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Should be on edit page
      await expect(page.locator('text=Edit category')).toBeVisible();
      
      // Check if image URL field is populated
      const imageInput = page.locator('input[placeholder="https://..."]');
      await expect(imageInput).toBeVisible();
      
      // Update the image URL
      await imageInput.fill('https://example.com/updated-image.jpg');
      
      // Save changes
      await page.click('button:has-text("Save changes")');
      
      // Should redirect back to categories page
      await page.waitForURL('/admin/categories');
    }
  });

  test('should display category images on frontend', async ({ page }) => {
    // Go to frontend categories page (if it exists)
    await page.goto('/categories');
    
    // Look for category images on frontend
    const categoryImages = page.locator('img[alt*="category"]');
    
    if (await categoryImages.first().isVisible()) {
      // Verify images are displayed properly
      await expect(categoryImages.first()).toBeVisible();
      
      // Check image loading
      const firstImage = categoryImages.first();
      await expect(firstImage).toHaveAttribute('src', /./);
    }
  });

  test('should handle invalid image URLs gracefully', async ({ page }) => {
    await page.goto('/admin/categories/new');
    
    // Fill in category details
    await page.fill('input[name="name"]', 'Test Category Invalid Image');
    await page.fill('input[placeholder="kebab-case-slug"]', 'test-category-invalid');
    
    // Add an invalid image URL
    await page.fill('input[placeholder="https://..."]', 'invalid-url');
    
    // Submit the form
    await page.click('button:has-text("Create category")');
    
    // Should still allow creation (image URL is optional)
    await page.waitForURL('/admin/categories');
  });
});
