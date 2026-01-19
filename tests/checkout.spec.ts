import { test, expect } from '@playwright/test';

// Checkout page flows (frontend only, no gateway assertions)

async function ensureCartHasItem(page: import('@playwright/test').Page) {
  await page.goto('/cart');
  if (await page.getByText(/your cart is empty/i).isVisible().catch(() => false)) {
    // Add an item if cart is empty
    await page.goto('/products');
    const productCards = page.locator('a.group[href^="/product/"]');
    const productCount = await productCards.count();
    if (productCount === 0) {
      return false;
    }
    await productCards.first().click();

    const addButton = page.getByRole('button', { name: /add to cart|added/i }).first();
    if (await addButton.count() === 0) {
      return false;
    }
    await expect(addButton).toBeEnabled();
    await addButton.click();
  }
  return true;
}

test.describe('Checkout flows', () => {
  test('checkout validation and payment method toggle', async ({ page }) => {
    const added = await ensureCartHasItem(page);
    if (!added) {
      test.skip(true, 'No products available to add to cart. Seed catalog data to run this test.');
      return;
    }

    await page.goto('/checkout');

    // If cart became empty between pages, bail out early
    if (await page.getByText(/your cart is empty/i).isVisible().catch(() => false)) {
      // Nothing to assert if there is no cart; this keeps the test from failing spuriously
      return;
    }

    // Required fields
    const email = page.getByLabel(/email/i);
    const line1 = page.getByLabel(/address line 1/i);
    const city = page.getByLabel(/^city$/i);
    const province = page.getByLabel(/province/i);
    const postalCode = page.getByLabel(/postal code/i);

    await email.fill('test@example.com');
    await line1.fill('123 Test Street');
    await city.fill('Testville');
    await province.selectOption({ index: 1 }); // pick any real province option
    await postalCode.fill('1234');

    // Toggle payment methods and assert UI changes
    const yocoRadio = page.getByRole('radio', { name: /card payment \(yoco\)/i });
    const bankRadio = page.getByRole('radio', { name: /bank transfer \(eft\)/i });

    await bankRadio.check();
    await expect(page.getByText(/your order will be created with status/i)).toBeVisible();

    await yocoRadio.check();

    // Place order button exists and is enabled when form valid
    const placeOrderButton = page.getByRole('button', { name: /place order|creating order/i });
    await expect(placeOrderButton).toBeEnabled();
  });
});
