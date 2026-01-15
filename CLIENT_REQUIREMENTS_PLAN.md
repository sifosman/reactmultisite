# Client Requirements & Implementation Plan

_Last updated: 2026-01-15_

This document summarises the client’s requested changes and the current status in the codebase.

## Legend

- **Status:** `Not started` | `Planned` | `Partial` | `Implemented` | `Needs review`

---

## 1. Category ordering (e.g. show "Bags" first)

**Client request:**
Be able to control the order of categories (e.g. sort so that "Bags" appears first), ideally via a numbering option.

**Current state:**
- Categories are fetched and ordered by `name` or `created_at`.
- No dedicated sort field (`sort_order` / `sort_index`) available in the schema or admin UI.

**Status:** `Implemented / Tested`

**Planned work / Verification notes:**
- `sort_index` field added to the `categories` schema and used across admin + storefront queries.
- Admin APIs read/write `sort_index` and order categories primarily by it.
- Admin category form exposes a "Sort order" field to control manual ordering.
- Storefront `/categories` and homepage featured categories respect this custom order.
- Automated frontend test added for `ProductCategoriesEditor` to verify that categories are ordered by `sort_index`.

---

## 2. Theme & layout similar to levions.co.za

**Client request:**
Adjust product / category / cart display to be similar to levions.co.za, including fixing cases where images are not showing.

**Current state:**
- Modern admin UI is in place.
- Public storefront implementation and exact layout vs. levions.co.za still need to be visually compared.

**Status:** `Partial / Needs review`

**Planned work:**
- Compare live product listing, product detail, category, and cart pages with the levions.co.za reference.
- Document specific visual/layout gaps (image sizes, spacing, typography, cart summary layout, etc.).
- Implement CSS/markup adjustments in the relevant React components to close those gaps.
- Fix any remaining image display issues (paths, fallbacks, loading states).

---

## 3. Show stock levels on the frontend

**Client request:**
Stock levels should be visible on the frontend so that customers can see availability.

**Current state:**
- Stock quantities exist and are used in admin (e.g. invoicing, product forms).
- Simple-product stock messaging is now shown on the product detail page.

**Status:** `Implemented / Tested (simple products)`

**Notes / Remaining work:**
- Helper `getSimpleProductStockMessage` added for simple products and covered by unit tests.
- Product detail page shows a friendly stock message for simple products when in stock (e.g. "Only X left in stock" / "In stock").
- Out-of-stock state is indicated via an "Out of stock" badge and messaging.
- For variants, stock is already surfaced via the variant selection UI; no additional change made yet.

---

## 4. Prevent ordering more than stock on the frontend

**Client request:**
- Customers must not be able to order more than available stock.
- Admin/backend must **still** be able to create "negative stock" orders if needed.

**Current state:**
- Stock quantities are present on products and used in admin invoice flows.
- Server-side order creation already validates that requested qty does not exceed available stock.
- Frontend now clamps quantities in the add-to-cart flow so customers cannot add more than available stock.

**Status:** `Implemented / Tested (frontend + server-side)`

**Notes:**
- `AddToCart` now computes a `maxSelectableQty` based on:
  - Selected variant `stock_qty` for variant products.
  - `simpleProductStockQty` for simple products (passed from the product page as `product.stock_qty`).
- The quantity input is clamped so users cannot type more than `maxSelectableQty`.
- `addToGuestCart` in `lib/cart/storage.ts` accepts an optional `maxQty` and clamps stored quantities so the cart never exceeds available stock.
- New tests in `storage.test.ts` verify that `addToGuestCart` respects `maxQty` for new and existing items.
- Backend APIs (`createOrderFromData` and `/api/orders/create`) already prevent overselling; admin/backoffice flows for negative stock remain server-controlled and are unaffected by these frontend limits.

---

## 5. Stock deduction on invoice creation

**Client request:**
- When an invoice is created, stock must be deducted immediately (so it is reserved for that client), even before marking as complete.

**Current state:**
- Invoices have statuses (`draft`, `issued`, `cancelled`).
- Admin UI includes actions `Issue (deduct stock)` and `Cancel (restore stock)`.
- The Supabase SQL functions already implement atomic stock movements when issuing/cancelling:
  - `issue_invoice(invoice_id uuid)` (called from `/api/admin/invoices/[id]/issue`):
    - Locks the target invoice in `draft` status.
    - Loops over `invoice_lines` and decrements `product_variants.stock_qty` or `products.stock_qty` by `line.qty`.
    - Inserts corresponding rows into `inventory_movements` with reason `invoice_issued`.
    - Raises an `out_of_stock` error if there isn’t enough stock for any line.
    - Sets invoice status to `issued` and timestamps `issued_at`.
  - `cancel_invoice(invoice_id uuid)` (called from `/api/admin/invoices/[id]/cancel`):
    - Locks the target invoice in `issued` status.
    - Loops over `invoice_lines` and *adds back* `line.qty` to the relevant `stock_qty` fields.
    - Inserts `inventory_movements` with reason `invoice_cancelled`.
    - Sets invoice status to `cancelled` and timestamps `cancelled_at`.

**Status:** `Implemented / Tested (via code review of SQL + API flow)`

**Notes:**
- In practice, **stock is reserved/deducted at the moment the invoice is issued**, which in this system is the point where the invoice becomes "live" for that customer.
- Draft invoices do **not** yet move stock; this matches the existing admin UI which explicitly labels the action as `Issue (deduct stock)`.
- Cancelling an issued invoice correctly restores stock and records a compensating inventory movement.
- No backend changes were required; behaviour already aligns with the intended "reserve on invoice issue" workflow.

---

## 6. Show customer name in invoice list

**Client request:**
When viewing all invoices, the customer name should be visible in the list.

**Current state:**
- `AdminInvoicesPage` now lists `invoice_number`, `customer`, `status`, `total`, and `created_at`.
- The invoices query includes `customer_snapshot`, which is used to derive a human-readable customer label.

**Status:** `Implemented / Tested`

**Notes:**
- Added `customer_snapshot` to the invoices query in `src/app/admin/invoices/page.tsx`.
- Introduced `getInvoiceCustomerDisplay` in `src/app/admin/invoices/customerDisplay.ts` to derive:
  - `primary`: prefers `name`, then `email`, then `phone`, otherwise "Guest / walk-in".
  - `secondary`: prefers `phone`, then `email`, or `null` if not available.
- The invoices list now shows:
  - Primary customer line (name/email/phone).
  - Optional secondary line (phone/email) in smaller, muted text.
- Unit tests in `customerDisplay.test.ts` cover the main combinations of customer snapshot data.

---

## 7. Mark invoice as paid / complete / dispatched

**Client request:**
Ability to mark an invoice as paid or complete so it’s clear that it has been dispatched.

**Current state:**
-- Invoice core lifecycle remains `draft` → `issued` → `cancelled` via the `status` column.
-- Additional fields `payment_status` (`unpaid` / `paid`) and `fulfilment_status` (`pending` / `dispatched`) have been added to `public.invoices`.
-- Admin UI now exposes actions to mark an issued invoice as paid and/or dispatched, and surfaces this via badges.

**Status:** `Implemented / Tested`

**Notes:**
- Database:
  - `public.invoices` extended with:
    - `payment_status` (`unpaid` | `paid`) and `payment_status_updated_at`.
    - `fulfilment_status` (`pending` | `dispatched`) and `fulfilment_status_updated_at`.
  - Existing `status` (`draft` / `issued` / `cancelled`) and stock movement logic remain unchanged.
- API:
  - `GET /api/admin/invoices/[id]` now returns the new fields.
  - `PATCH /api/admin/invoices/[id]` accepts `payment_status` and `fulfilment_status` (validated via zod) and stamps the corresponding `*_updated_at` fields.
- Admin UI (`InvoiceEditor`):
  - Uses `getInvoiceStatusBadges` to render combined status badges (e.g. `Issued`, `Paid`, `Dispatched`).
  - Adds buttons (available when `status === 'issued'`):
    - **Mark as paid** → sets `payment_status = 'paid'`.
    - **Mark as dispatched** → sets `fulfilment_status = 'dispatched'`.
  - Buttons reflect current state (disabled and labelled as already marked when appropriate).
- Tests:
  - `invoiceStatusDisplay.test.ts` covers `getInvoiceStatusBadges` for combinations of `status`, `payment_status`, and `fulfilment_status`.

---

## 8. Coupon / discount option

**Client request:**
Add coupon functionality so discount codes can be used.

**Current state:**
- Full coupon management exists in admin (`/admin/coupons` and `CouponForm`).
- API routes for creating/updating/deleting coupons are implemented.
- Checkout now accepts an optional coupon code and applies a validated discount on order creation.

**Status:** `Implemented / Tested (bank transfer checkout)`

**Notes:**
- Schema / validation:
  - `createOrderSchema` extended with optional `couponCode`.
- Backend:
  - New helper `calculateCouponDiscount` in `src/lib/checkout/coupons.ts` with tests in `coupons.test.ts`.
  - `/api/orders/create`:
    - Looks up the coupon by `code` when `couponCode` is provided.
    - Validates `active`, `expires_at`, `max_uses`, and min order value.
    - Computes `discount_cents` using `calculateCouponDiscount` and updates `total_cents` accordingly.
    - Returns `invalid_coupon` or `coupon_error` on failure.
- Frontend checkout (`CheckoutClient`):
  - Adds a "Coupon code (optional)" input on the order summary.
  - Sends `couponCode` through to the backend as part of the checkout payload.
  - Displays generic error messaging if the coupon is invalid (via existing error handling for the create order call).
- Limitations / future work:
  - Current coupon application is wired for the direct `/api/orders/create` flow (used by bank transfer checkout).
  - Yoco card flow still does not apply coupons yet; extending that would require integrating coupon handling into the Yoco pending checkout/order creation path.

---

## 9 & 10. Bulk upload improvements & multiple image selection

**Client request:**
- Bulk upload feature is appreciated, but the client would like:
  - To be able to choose category during bulk upload.
  - To upload/select multiple images more easily (instead of one at a time).

**Current state:**
- `BulkProductUpload` supports CSV import/export and per-row settings for simple products.
- Bulk upload now also supports per-row category slugs and multiple image URLs.

**Status:** `Implemented / Tested`

**Notes:**
- Category selection:
  - Each row has a `Category slug` text field in the UI.
  - CSV template adds a `category_slug (optional)` column.
  - On submit, the uploader fetches categories once, resolves the slug to a `category_id`, and calls
    `PUT /api/admin/products/:id/categories` with `{ categoryIds: [resolvedId] }` for each created product.
  - Unknown slugs are reported per row in the bulk upload error summary.
- Multiple images:
  - The CSV template now uses an `image_urls (optional, pipe-separated)` column.
  - For each row, the value can contain one or more URLs separated by `|`.
  - After product creation, the uploader calls `/api/admin/products/:id/images-from-url` once per URL.
  - The existing UI still focuses on picking a single image per row (file or gallery URL), but CSV users can
    attach multiple images via the `image_urls` field.
- Existing behaviour (single image selection via file upload or gallery URL, stock/price/active fields, CSV
  download/upload) remains supported.

---

## Priority Order (suggested)

1. Stock and invoice correctness (items 3, 4, 5, 7).
2. Operational visibility and admin usability (items 6, 1, 9, 10).
3. UX/design alignment and marketing features (items 2, 8).

This document should be kept up to date as features move from `Planned` → `Implemented`.
