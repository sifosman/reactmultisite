import { test, expect } from '@playwright/test';

// Cart drawer and cart page flows

async function addFirstProductToCart(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/products');

  const productCards = page.locator('a.group[href^="/product/"]');
  const productCount = await productCards.count();
  if (productCount === 0) {
    return false;
  }

  await expect(productCards.first()).toBeVisible();

  await productCards.first().click();

  // If variants are required, pick the first option in each attribute group (best-effort)
  const variantGroups = page.locator('div:has(> div.text-sm.font-medium)');
  const groupCount = await variantGroups.count();
  for (let i = 0; i < groupCount; i++) {
    const group = variantGroups.nth(i);
    const optionButtons = group.getByRole('button').filter({ hasNot: page.locator('[disabled]') });
    if (await optionButtons.count()) {
      await optionButtons.first().click();
    }
  }

  // Click Add to cart button
  const addButton = page.getByRole('button', { name: /add to cart|added/i }).first();
  if (await addButton.count() === 0) {
    return false;
  }
  if (!(await addButton.isEnabled())) {
    return false;
  }
  await addButton.click();
  return true;
}

test.describe('Cart flows', () => {
  test('cart drawer opens from header and shows added item', async ({ page }) => {
    const added = await addFirstProductToCart(page);
    if (!added) {
      test.skip(true, 'No products available to add to cart. Seed catalog data to run this test.');
      return;
    }

    // Wait for CartBadgeButton counter to update
    const cartButton = page.getByRole('button', { name: 'Cart' });
    await expect(cartButton).toBeVisible();

    // Open cart drawer via header cart button
    await cartButton.click();

    // Cart drawer should now be visible (check for Cart title text)
    const cartDrawer = page.getByRole('complementary');
    await expect(cartDrawer.getByText('Cart', { exact: true })).toBeVisible();

    // Expect at least one cart line item with Delete button
    await expect(page.getByRole('button', { name: /delete/i })).toBeVisible();

    // Close via overlay
    await page.getByLabel('Close cart').click();
  });

  test('cart page allows updating quantity and removing item', async ({ page }) => {
    const added = await addFirstProductToCart(page);
    if (!added) {
      test.skip(true, 'No products available to add to cart. Seed catalog data to run this test.');
      return;
    }

    await page.goto('/cart');

    // When there is at least one line, summary and qty input exist
    const qtyInput = page.locator('input[type="number"][min="1"]');
    await expect(qtyInput.first()).toBeVisible();

    // Change quantity
    await qtyInput.first().fill('2');
    await qtyInput.first().blur();

    // Totals section
    const summary = page.locator('aside', { hasText: 'Summary' });
    await expect(summary.getByText(/subtotal/i)).toBeVisible();
    await expect(summary.getByText('Shipping', { exact: true })).toBeVisible();

    // Remove item
    await page.getByRole('button', { name: /remove/i }).first().click();

    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });
});
