import { test, expect, type Page } from '@playwright/test';

const adminEmail = 'nabeel@ampbutchery.co.za';
const adminPassword = 'Thierry14247!';

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  if (page.url().includes('/admin')) {
    return;
  }

  const signInHeading = page.getByRole('heading', { name: /sign in/i });
  if (await signInHeading.isVisible().catch(() => false)) {
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await emailInput.fill(adminEmail);
    await passwordInput.fill(adminPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
  }

  await expect(page).toHaveURL(/\/admin/);
}

test.describe.serial('Admin dashboard', () => {
  test('dashboard overview and navigation shell', async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /products/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /categories/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /orders/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /invoices/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /customers/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /coupons/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /subscribers/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /site content/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /theme selector/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /delivery settings/i })).toBeVisible();
  });

  test('products CRUD + bulk upload', async ({ page }) => {
    const productName = uniqueId('Test Product');
    const productSlug = productName.toLowerCase().replace(/\s+/g, '-');
    const bulkProductName = uniqueId('Bulk Product');

    await loginAsAdmin(page);
    await page.goto('/admin/products');

    await page.getByRole('link', { name: /add product/i }).click();
    await expect(page.getByRole('heading', { name: /new product/i })).toBeVisible();

    await page.getByLabel('Name').fill(productName);
    await page.getByLabel('Slug').fill(productSlug);
    await page.getByLabel(/regular price/i).fill('99.00');
    await page.getByLabel(/sale price/i).fill('');
    await page.getByLabel(/stock quantity/i).fill('10');
    await page.getByRole('button', { name: /create product/i }).click();

    await expect(page).toHaveURL(/\/admin\/products/);
    const productRow = page.locator('tr', { hasText: productName });
    await expect(productRow).toBeVisible();

    await productRow.locator('a[href^="/admin/products/"]').click();
    await expect(page.getByRole('heading', { name: /edit product/i })).toBeVisible();

    await page.getByLabel(/description/i).fill('Updated description');

    const categoriesEmpty = await page.getByText(/no categories yet/i).isVisible().catch(() => false);
    if (!categoriesEmpty) {
      const firstCategory = page.locator('label', { hasText: /.+/ }).filter({ has: page.locator('input[type="checkbox"]') }).first();
      await firstCategory.locator('input[type="checkbox"]').check();
      await page.getByRole('button', { name: /^save$/i }).first().click();
    }

    const filePath = 'c:/Projects/Aff React/reactmultisite/public/file.svg';
    const imageInput = page.locator('input[type="file"]').first();
    await imageInput.setInputFiles(filePath);
    await page.getByRole('button', { name: /upload/i }).first().click();

    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page).toHaveURL(/\/admin\/products/);

    await page.goto('/admin/products/bulk');
    await expect(page.getByRole('heading', { name: /bulk upload products/i })).toBeVisible();

    await page.getByPlaceholder('Product name').first().fill(bulkProductName);
    await page.getByPlaceholder('0.00').first().fill('45.00');
    await page.getByRole('button', { name: /create .* products/i }).click();
    await expect(page.getByText(/created/i)).toBeVisible();

    await page.goto('/admin/products');
    const createdRows = [productName, bulkProductName];
    for (const name of createdRows) {
      const row = page.locator('tr', { hasText: name });
      await expect(row).toBeVisible();
      page.once('dialog', (dialog) => dialog.accept());
      await row.getByRole('button', { name: /delete product/i }).click();
    }
  });

  test('categories CRUD', async ({ page }) => {
    const categoryName = uniqueId('Test Category');
    const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');

    await loginAsAdmin(page);
    await page.goto('/admin/categories');

    await page.getByRole('link', { name: /add category/i }).click();
    await expect(page.getByRole('heading', { name: /new category/i })).toBeVisible();

    await page.getByLabel('Name').fill(categoryName);
    await page.getByLabel('Slug').fill(categorySlug);
    await page.getByLabel(/image url/i).fill('https://example.com/category.png');
    await page.getByLabel(/sort order/i).fill('1');
    await page.getByRole('button', { name: /create category/i }).click();

    await expect(page).toHaveURL(/\/admin\/categories/);
    const card = page.locator('div', { hasText: categoryName }).first();
    await card.getByRole('link', { name: /edit/i }).click();

    await expect(page.getByRole('heading', { name: /edit category/i })).toBeVisible();
    await page.getByLabel('Name').fill(`${categoryName} Updated`);
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page).toHaveURL(/\/admin\/categories/);
    const updatedCard = page.locator('div', { hasText: `${categoryName} Updated` }).first();
    await updatedCard.getByRole('link', { name: /edit/i }).click();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /delete category/i }).click();
    await expect(page).toHaveURL(/\/admin\/categories/);
  });

  test('coupons CRUD', async ({ page }) => {
    const couponCode = uniqueId('SAVE').toUpperCase();

    await loginAsAdmin(page);
    await page.goto('/admin/coupons');

    await page.getByRole('link', { name: /create coupon/i }).click();
    await expect(page.getByRole('heading', { name: /create coupon/i })).toBeVisible();

    await page.getByLabel(/coupon code/i).fill(couponCode);
    await page.getByLabel(/discount value/i).fill('10');
    await page.getByRole('button', { name: /create coupon/i }).click();

    await expect(page).toHaveURL(/\/admin\/coupons/);
    await page.getByRole('link', { name: /edit/i }).first().click();

    await expect(page.getByRole('heading', { name: /edit coupon/i })).toBeVisible();
    await page.getByLabel(/discount value/i).fill('15');
    await page.getByRole('button', { name: /save changes/i }).click();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /delete coupon/i }).click();
    await expect(page).toHaveURL(/\/admin\/coupons/);
  });

  test('orders list + status update', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/orders');

    const empty = await page.getByText(/no orders yet/i).isVisible().catch(() => false);
    if (empty) {
      test.skip(true, 'No orders available to validate.');
      return;
    }

    await page.getByRole('link', { name: /view/i }).first().click();
    await expect(page.getByRole('heading', { name: /order detail/i })).toBeVisible();

    const statusSelect = page.locator('select').first();
    const currentStatus = await statusSelect.inputValue();
    await statusSelect.selectOption(currentStatus);
    await page.getByRole('button', { name: /^save$/i }).click();
  });

  test('customers list + create', async ({ page }) => {
    const customerEmail = `${uniqueId('customer')}@example.com`;

    await loginAsAdmin(page);
    await page.goto('/admin/customers');

    await page.getByRole('link', { name: /add customer/i }).click();
    await expect(page.getByRole('heading', { name: /new customer/i })).toBeVisible();

    await page.getByLabel(/email/i).fill(customerEmail);
    await page.getByLabel(/full name/i).fill('Test Customer');
    await page.getByLabel(/phone/i).fill('0821234567');
    await page.getByLabel(/address/i).fill('123 Test Street');
    await page.getByRole('button', { name: /create customer/i }).click();

    await expect(page).toHaveURL(/\/admin\/customers/);
    await expect(page.getByText(customerEmail)).toBeVisible();
  });

  test('invoices flow', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/invoices');

    await page.getByRole('link', { name: /new invoice/i }).click();
    await expect(page).toHaveURL(/\/admin\/invoices\//);

    await page.getByLabel(/client name/i).fill('Invoice Client');
    await page.getByLabel(/phone/i).fill('0825550000');
    await page.getByLabel(/email/i).fill('invoice@example.com');
    await page.getByRole('button', { name: /^save$/i }).click();

    const catalogInput = page.getByPlaceholder(/search products/i);
    await catalogInput.fill('test');

    const addButtons = page.getByRole('button', { name: /^add$/i });
    if ((await addButtons.count()) > 0) {
      await addButtons.first().click();
      await expect(page.getByText(/line total/i)).toBeVisible();

      const issueButton = page.getByRole('button', { name: /issue/i });
      if (await issueButton.isEnabled()) {
        await issueButton.click();
      }

      const markPaidButton = page.getByRole('button', { name: /mark as paid/i });
      if (await markPaidButton.isEnabled()) {
        await markPaidButton.click();
      }

      const markDispatchedButton = page.getByRole('button', { name: /mark as dispatched/i });
      if (await markDispatchedButton.isEnabled()) {
        await markDispatchedButton.click();
      }

      const downloadPromise = page.waitForEvent('download').catch(() => null);
      await page.getByRole('link', { name: /download pdf/i }).click();
      await downloadPromise;

      const cancelButton = page.getByRole('button', { name: /cancel/i });
      if (await cancelButton.isEnabled()) {
        await cancelButton.click();
      }
    }
  });

  test('subscribers list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/subscribers');
    await expect(page.getByRole('heading', { name: /subscribers/i })).toBeVisible();
  });

  test('site content editor', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/content');
    await expect(page.getByRole('heading', { name: /content/i })).toBeVisible();

    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();
    await expect(page.getByText(/save failed/i)).toHaveCount(0);
  });

  test('theme selector apply and revert', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/themes');

    const activeBadge = page.getByText(/^Active$/).first();
    const activeCard = activeBadge.locator('xpath=ancestor::div[contains(@class,"rounded-xl")]');
    const activeName = await activeCard.locator('h3').first().textContent();

    const applyButton = page.getByRole('button', { name: /apply theme/i }).first();
    if (await applyButton.isVisible().catch(() => false)) {
      await applyButton.click();
      await page.waitForLoadState('networkidle');
    }

    if (activeName) {
      await page.goto('/admin/themes');
      const originalCard = page
        .locator('h3', { hasText: activeName })
        .first()
        .locator('xpath=ancestor::div[contains(@class,"rounded-xl")]');
      const originalApply = originalCard.getByRole('button', { name: /apply theme/i });
      if (await originalApply.isVisible().catch(() => false)) {
        await originalApply.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('settings + delivery settings', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/settings');
    await expect(page.getByText(/integrations/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /open setup wizard/i })).toBeVisible();

    await page.goto('/admin/delivery-settings');
    await expect(page.getByRole('heading', { name: /delivery settings/i })).toBeVisible();

    const flatRateInput = page.getByLabel(/flat rate \(r\)/i);
    const originalFlatRate = await flatRateInput.inputValue();

    const flatModeRadio = page.getByLabel(/flat rate \(all provinces\)/i);
    const perProvinceRadio = page.getByLabel(/per province/i);

    const wasFlat = await flatModeRadio.isChecked();
    if (wasFlat) {
      await perProvinceRadio.check();
    } else {
      await flatModeRadio.check();
    }

    await flatRateInput.fill('65.00');
    await page.getByRole('button', { name: /save delivery settings/i }).click();
    await expect(page.getByText(/settings saved successfully/i)).toBeVisible();

    if (wasFlat) {
      await flatModeRadio.check();
    } else {
      await perProvinceRadio.check();
    }
    await flatRateInput.fill(originalFlatRate || '60.00');
    await page.getByRole('button', { name: /save delivery settings/i }).click();
    await expect(page.getByText(/settings saved successfully/i)).toBeVisible();
  });
});
