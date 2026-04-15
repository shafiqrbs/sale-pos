# Invoice Purchase — Discount / Payment Save Flow

Context snapshot for resuming work on the invoice-purchase save logic. Covers what was changed, why, and where to continue.

## Scope

Feature under edit: **Invoice Purchase** entry screen.
Module path: [src/modules/inventory/invoice-purchase/](../src/modules/inventory/invoice-purchase)

Two code paths persist a purchase:

1. **Online API** — RTK Query mutation `useAddInvoicePurchaseMutation` from [src/services/invoice-purchase.js](../src/services/invoice-purchase.js).
2. **Offline local** — `window.dbAPI.upsertIntoTable("purchase", record)` into better-sqlite3 table `purchase` (main process, [electron/db.cjs](../electron/db.cjs)).

Which path runs is decided by `shouldSubmitPurchaseOnline = isOnline && is_purchase_online` in [NewIndex.jsx](../src/modules/inventory/invoice-purchase/NewIndex.jsx).

## Relevant Files

| File                                                                                     | Role                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [NewIndex.jsx](../src/modules/inventory/invoice-purchase/NewIndex.jsx)                   | Page container. Owns `itemsForm`, builds local record + API payload, runs `handleSubmit`.                                                                                     |
| [PaymentSection.jsx](../src/modules/inventory/invoice-purchase/PaymentSection.jsx)       | Renders Payment Mode, Discount badges, Pay/Due inputs. Computes `discountValue` and `discountPercent` for display. Auto-populates `paymentAmount` with `grandTotal` on mount. |
| [Overview.jsx](../src/modules/inventory/invoice-purchase/Overview.jsx)                   | Wraps `ItemsTableSection` + `PaymentSection`.                                                                                                                                 |
| [ItemsTableSection.jsx](../src/modules/inventory/invoice-purchase/ItemsTableSection.jsx) | Cart grid (Name / AVG.PP / Expiry / MRP / QTY / BonusQty / Total).                                                                                                            |
| [helpers/request.js](../src/modules/inventory/invoice-purchase/helpers/request.js)       | `vendorOverviewRequest(t)` — mantine form initialValues + validation.                                                                                                         |
| [src/services/invoice-purchase.js](../src/services/invoice-purchase.js)                  | RTK Query endpoints (`addInvoicePurchase`, etc.).                                                                                                                             |
| [src/hooks/useTempPurchaseProducts.js](../src/hooks/useTempPurchaseProducts.js)          | Reads persisted temp cart from `temp_purchase_products` where `type="invoice_purchase"`.                                                                                      |

## Data Model — Purchase Record

Fields written by `handleSubmit` in [NewIndex.jsx](../src/modules/inventory/invoice-purchase/NewIndex.jsx):

### Local (`purchase` table)

```js
{
  invoice,              // generateInvoiceId()
  sub_total,            // sum(qty * mrp)
  total,                // sub_total - discountValue  (grandTotal)
  payment,              // formValues.paymentAmount
  due,                  // formValues.dueAmount
  discount,             // max(sub_total - payment - due, 0)
  discount_calculation, // percent value rounded to 2dp
  discount_type,        // "Percent"
  approved_by_id,
  vendor_id, vendor_name,
  createdByUser, createdByName, createdById,
  process: "",
  mode_name,            // transactionMode label
  transaction_mode_id,
  purchase_items,       // JSON.stringify(purchaseItemsForDb)
  created,              // formatDateTime(new Date())
  purchase_mode: "invoice",
}
```

### API payload (online)

```js
{
  vendor_id, vendor_name, vendor_mobile, vendor_email,
  sub_total,
  transaction_mode_id,
  discount_type: "Percent",
  discount,
  discount_calculation,  // percent value rounded to 2dp
  total,                 // sub_total - discountValue
  due,
  payment: String(paymentAmount),
  process: "",
  narration,
  warehouse_id: "",
  invoice_date,          // formatDateISO
  items: [{ product_id, warehouse_id, quantity, purchase_price, sales_price, bonus_quantity, sub_total, name }],
  purchase_mode: "invoice",
}
```

## Discount Math (Authoritative)

The UI lets user enter Pay + Due. Discount is **derived**, not entered directly:

```js
subTotal = Σ(qty * mrp);
discountValue = max(subTotal - payment - due, 0);
discountPercent = subTotal > 0 ? (discountValue / subTotal) * 100 : 0;
grandTotal = max(subTotal - discountValue, 0); // equals payment + due when non-negative
```

Example from the screenshot (what prompted the fix):

| Field                | Value       |
| -------------------- | ----------- |
| sub_total            | 16000       |
| payment              | 10000       |
| due                  | 3000        |
| discount             | 3000        |
| discount_calculation | 18.75       |
| discount_type        | `"Percent"` |
| total                | 13000       |

`discount_calculation` is stored as `Number(discountPercent.toFixed(2))`.

## What Was Fixed (this session)

Before:

- `total` was `Math.round(paymentAmount)` — wrong; ignored due and treated payment as final.
- Local record used `discount_type: "Flat"` and `discount_calculation: discountValue` (stored currency, not percent).
- API payload hardcoded `discount_calculation: 0` and omitted `discount_type`.

After (see edits in [NewIndex.jsx](../src/modules/inventory/invoice-purchase/NewIndex.jsx)):

- Added derived `discountPercent` and `grandTotal` in `handleSubmit`.
- `localPurchaseRecord`: `total = grandTotal`, `discount_type = "Percent"`, `discount_calculation = Number(discountPercent.toFixed(2))`.
- `buildPurchaseApiPayload`: same three fields mirrored.

`PaymentSection.jsx` already computed `discountValue` and `discountPercent` for display — the save path now matches what the UI shows.

## Form State Shape (`itemsForm`)

Defined in [helpers/request.js](../src/modules/inventory/invoice-purchase/helpers/request.js). Relevant fields:

- `vendor_id`, `vendorName`, `vendorPhone`, `vendorEmail`
- `transactionModeId`, `transactionMode`
- `paymentAmount`, `dueAmount`
- `purchaseNarration`
- `purchaseDate`

Validations required by `handleSubmit`:

- items present (from `useTempPurchaseProducts`)
- `vendor_id`
- `transactionModeId`
- `paymentAmount`

## Post-save Side Effects

1. `updateProductsAfterPurchase()` — for each cart item, read `core_products` row, `quantity += purchased qty`, update. Then dispatches `products-updated` window event.
2. Clears `temp_purchase_products` where `type="invoice_purchase"`, then `refetch()`.
3. Partial form reset: preserves vendor fields + transaction mode; wipes everything else.
4. Notifies `PurchaseAddedSuccessfully`.

## Open Questions / TODO for Next Session

- [ ] Should `discount_type` ever be `"Flat"`? Currently hardcoded `"Percent"` because discount is always derived from pay/due. If a manual flat-amount entry is added to the UI, revisit.
- [ ] API still omits `discount_type` in commented-out line style — now set, but double-check backend accepts exact string `"Percent"` (case, spelling) vs `"percent"` / `"FLAT"`.
- [ ] `total` in API payload — backend may recompute. Confirm backend trusts client `total` or derives from items + discount.
- [ ] `payment` is sent as `String(paymentAmount)` in API but `Number` in local. Confirm backend contract.
- [ ] `purchase_items` is `JSON.stringify`'d for local storage (sqlite TEXT column). Any reader must use `parseJsonArray` from [src/common/utils/index.js](../src/common/utils/index.js) — never `JSON.parse` directly (project rule).
- [ ] `Hold` / `Print` / `Reset` buttons in [PaymentSection.jsx](../src/modules/inventory/invoice-purchase/PaymentSection.jsx) have IDs (`ItemsHoldFormSubmit` etc.) and hotkeys but no handlers wired. Check whether these are implemented elsewhere or pending.
- [ ] Edit mode: `NewIndex.jsx` always creates new records. If an edit page exists and shares `handleSubmit` logic, mirror the discount fix there too. Search for `useUpdateInvoicePurchaseMutation` or similar.

## Project Rules (must follow when continuing)

From [CLAUDE.md](../CLAUDE.md):

- **i18n** — every user-facing string via `t()`. Add keys to both [src/lang/en/translation.json](../src/lang/en/translation.json) and [src/lang/bn/translation.json](../src/lang/bn/translation.json).
- **Modals/Drawers** — `useDisclosure`, never `useState(boolean)`.
- **Notifications** — `showNotification` from `@components/ShowNotificationComponent`.
- **JSON parse** — use `parseJsonArray` / helpers in `@utils/index`, never raw `JSON.parse` in components.
- **React imports** — named only. Never `import React from "react"`.
- **Electron main** — single `Database` from `electron/connection.cjs`. All `ipcMain.handle` in `electron/ipcHandlers.cjs`. Validate dynamic table/column names via `electron/validators.cjs`.
- **Auth** — offline only via `window.authAPI.loginUser`. Bcrypt in main process only.

## Git State at Snapshot

Branch: `master`
Modified (uncommitted): `src/modules/inventory/invoice-purchase/NewIndex.jsx`, `src/modules/inventory/invoice-purchase/PaymentSection.jsx`
Last relevant commits: `ea52f42` (unit label + hotkey fix), `9cfa664` (expiration date check).
