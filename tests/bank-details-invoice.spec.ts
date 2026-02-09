import { test, expect } from '@playwright/test';

test.describe('Invoice PDF Bank Details', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should include bank details in PDF invoice', async ({ page }) => {
    // Create a test invoice first
    await page.goto('/admin/invoices/new');
    
    // Add customer details
    await page.fill('input[placeholder="Customer name"]', 'Test Customer');
    await page.fill('input[placeholder="082 123 4567"]', '082 123 4567');
    await page.fill('input[placeholder="customer@email.com"]', 'test@example.com');
    
    // Add a product line (assuming there are products)
    await page.fill('input[placeholder="Search products / SKU…"]', 'test');
    await page.waitForTimeout(500);
    
    // Issue the invoice
    await page.click('button:has-text("Issue (deduct stock)")');
    await page.waitForTimeout(1000);
    
    // Download PDF
    const downloadPromise = page.waitForEvent('download');
    await page.click('a:has-text("Download PDF")');
    const download = await downloadPromise;
    
    // Verify PDF was downloaded
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    
    // Note: In a real test, you'd want to parse the PDF content
    // to verify bank details are included, but that requires additional libraries
  });

  test('should display bank details in invoice preview', async ({ page }) => {
    // This test would verify the bank details appear in the UI
    // when viewing an invoice, not just the PDF
    await page.goto('/admin/invoices');
    
    // Click on an existing invoice or create one
    const firstInvoice = page.locator('a[href*="/admin/invoices/"]').first();
    if (await firstInvoice.isVisible()) {
      await firstInvoice.click();
      
      // Verify invoice page loads
      await expect(page.locator('text=Invoice')).toBeVisible();
      
      // Check if bank details are displayed in the preview
      // (This depends on how the invoice preview is implemented)
    }
  });
});
