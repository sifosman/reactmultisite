import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = "nabeel@ampbutchery.co.za";
const ADMIN_PASSWORD = "Thierry14247!";

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

async function adminLogin(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  if (page.url().includes("/login")) {
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/admin/);
  }
}

async function fillField(page: Page, labelText: string, value: string) {
  const label = page.locator("label", { hasText: labelText }).first();
  const input = label.locator("xpath=..")
    .locator("input, textarea, select")
    .first();
  await input.fill(value);
}

async function createCategory(page: Page, name: string, slug: string, sortOrder: string) {
  await page.goto("/admin/categories/new");
  await fillField(page, "Name", name);
  await fillField(page, "Slug", slug);
  await fillField(page, "Sort order", sortOrder);
  await page.getByRole("button", { name: "Create category" }).click();
  await page.waitForURL("/admin/categories");
}

async function createProduct(page: Page, name: string, slug: string, stockQty: string) {
  await page.goto("/admin/products/new");
  await fillField(page, "Name", name);
  await fillField(page, "Slug", slug);
  await fillField(page, "Regular price (ZAR)", "100.00");
  await fillField(page, "Stock quantity", stockQty);
  await page.getByRole("button", { name: "Create product" }).click();
  await page.waitForURL("/admin/products");
}

async function createCoupon(page: Page, code: string) {
  await page.goto("/admin/coupons/new");
  await fillField(page, "Coupon Code", code);
  await fillField(page, "Discount Value", "10");
  await page.getByRole("button", { name: "Create Coupon" }).click();
  await page.waitForURL("/admin/coupons");
}

async function addProductToInvoice(page: Page, productName: string) {
  await page.getByPlaceholder("Search products / SKU…").fill(productName);
  const result = page.getByRole("button", { name: new RegExp(productName, "i") }).first();
  await result.click();
}

test.describe.serial("Client requirements (Playwright)", () => {
  test("1. Category ordering respects sort order", async ({ page }) => {
    await adminLogin(page);
    const suffix = uniqueId("cat-order");
    const firstName = `PW First ${suffix}`;
    const firstSlug = `pw-first-${suffix}`;
    const secondName = `PW Second ${suffix}`;
    const secondSlug = `pw-second-${suffix}`;

    await createCategory(page, firstName, firstSlug, "1");
    await createCategory(page, secondName, secondSlug, "2");

    await page.goto("/categories");
    const titles = await page.locator("main a h2").allTextContents();
    const firstIndex = titles.findIndex((t) => t.includes(firstName));
    const secondIndex = titles.findIndex((t) => t.includes(secondName));
    expect(firstIndex).toBeGreaterThan(-1);
    expect(secondIndex).toBeGreaterThan(-1);
    expect(firstIndex).toBeLessThan(secondIndex);
  });

  test("3. Stock levels show messaging for simple products", async ({ page }) => {
    await adminLogin(page);
    const suffix = uniqueId("stock");
    const lowStockName = `PW Low Stock ${suffix}`;
    const lowStockSlug = `pw-low-stock-${suffix}`;
    const outStockName = `PW Out Stock ${suffix}`;
    const outStockSlug = `pw-out-stock-${suffix}`;

    await createProduct(page, lowStockName, lowStockSlug, "3");
    await createProduct(page, outStockName, outStockSlug, "0");

    await page.goto(`/product/${lowStockSlug}`);
    await expect(page.getByText("Only 3 left in stock")).toBeVisible();

    await page.goto(`/product/${outStockSlug}`);
    await expect(page.getByText("Out of stock", { exact: true })).toBeVisible();
  });

  test("4. Prevent ordering more than stock", async ({ page }) => {
    await adminLogin(page);
    const suffix = uniqueId("max-stock");
    const productName = `PW Max Stock ${suffix}`;
    const productSlug = `pw-max-stock-${suffix}`;

    await createProduct(page, productName, productSlug, "2");

    await page.goto(`/product/${productSlug}`);
    const qtyInput = page.getByText("Qty").locator("..").locator("input");
    await qtyInput.fill("10");
    await expect(qtyInput).toHaveValue("2");
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.goto("/cart");
    const cartQty = page.locator("input[type='number']").first();
    await expect(cartQty).toHaveValue("2");
  });

  test("5. Invoice issue flow is available (stock deduction workflow)", async ({ page }) => {
    await adminLogin(page);
    const suffix = uniqueId("invoice-issue");
    const productName = `PW Invoice Item ${suffix}`;
    const productSlug = `pw-invoice-item-${suffix}`;

    await createProduct(page, productName, productSlug, "5");

    await page.goto("/admin/invoices/new");
    await page.waitForURL(/\/admin\/invoices\//);
    await addProductToInvoice(page, productName);
    await page.getByRole("button", { name: "Issue (deduct stock)" }).click();
    await expect(page.getByText("Issued", { exact: true })).toBeVisible();
  });

  test("6. Customer name appears in invoice list", async ({ page }) => {
    await adminLogin(page);
    const suffix = uniqueId("invoice-customer");
    const customerName = `PW Customer ${suffix}`;

    await page.goto("/admin/invoices/new");
    await page.waitForURL(/\/admin\/invoices\//);
    const invoiceNumber = (await page.locator("div.font-mono").first().textContent())?.trim() ?? "";
    await fillField(page, "Client name", customerName);
    await page.getByRole("button", { name: "Save" }).click();
    await page.goto("/admin/invoices");

    const row = page.locator("tr", { hasText: invoiceNumber });
    await expect(row.getByText(customerName)).toBeVisible();
  });

  test("7. Mark invoice as paid and dispatched", async ({ page }) => {
    await adminLogin(page);
    const suffix = uniqueId("invoice-status");
    const productName = `PW Invoice Status ${suffix}`;
    const productSlug = `pw-invoice-status-${suffix}`;

    await createProduct(page, productName, productSlug, "5");

    await page.goto("/admin/invoices/new");
    await page.waitForURL(/\/admin\/invoices\//);
    await addProductToInvoice(page, productName);
    await page.getByRole("button", { name: "Issue (deduct stock)" }).click();
    await page.getByRole("button", { name: "Mark as paid" }).click();
    await page.getByRole("button", { name: "Mark as dispatched" }).click();
    await expect(page.getByText("Paid", { exact: true })).toBeVisible();
    await expect(page.getByText("Dispatched", { exact: true })).toBeVisible();
  });

  test("8. Coupon code is sent during checkout", async ({ page }) => {
    await adminLogin(page);
    const suffix = uniqueId("coupon");
    const productName = `PW Coupon Product ${suffix}`;
    const productSlug = `pw-coupon-product-${suffix}`;
    const couponCode = `SAVE${Date.now().toString().slice(-6)}`;

    await createProduct(page, productName, productSlug, "5");
    await createCoupon(page, couponCode);

    await page.goto(`/product/${productSlug}`);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.goto("/checkout");

    await fillField(page, "Email", "playwright@example.com");
    await fillField(page, "Address line 1", "123 Test Street");
    await fillField(page, "City", "Cape Town");
    await page.getByLabel("Province").selectOption("Gauteng");
    await fillField(page, "Postal code", "8001");
    await page.getByLabel("Bank transfer (EFT)").check();
    await fillField(page, "Coupon code", couponCode);

    const [request] = await Promise.all([
      page.waitForRequest((req) => req.url().includes("/api/orders/create")),
      page.getByRole("button", { name: "Place order" }).click(),
    ]);

    const payload = request.postDataJSON() as { couponCode?: string };
    expect(payload.couponCode).toBe(couponCode);
  });

  test("9/10. Bulk upload supports category slug and multiple image URLs", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/products/bulk");

    await expect(page.getByPlaceholder("e.g. bags")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download CSV template" }).click();
    const download = await downloadPromise;
    const csvPath = await download.path();
    expect(csvPath).not.toBeNull();

    if (csvPath) {
      const fs = await import("fs");
      const csv = fs.readFileSync(csvPath, "utf8");
      expect(csv).toContain("category_slug (optional)");
      expect(csv).toContain("image_urls (optional, pipe-separated)");
    }
  });
});
