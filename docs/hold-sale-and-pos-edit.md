# Hold Sale, POS Edit & Hold Processing Feature

## Overview
Added ability to "hold" sales (save with hold status), edit sales directly in the POS bakery interface, and process held sales from a dedicated Hold page.

---

## 1. Hold Sale (Status Column)

### Database
- **`electron/db.cjs`** — Added `status TEXT DEFAULT 'completed'` column to the `sales` table.
- Existing sales default to `'completed'`. Held sales are saved with `'hold'`.

> **Note:** For existing databases, run `ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'completed'` manually, since `CREATE TABLE IF NOT EXISTS` won't add new columns to an existing table.

### Save Flow
- **`Transaction.jsx`** — `handleSave` and `handleOfflineSave` now accept a `status` parameter (defaults to `"completed"`).
- The **Hold button** (`handlePrintAll`) passes `status: "hold"` to `handleSave`.
- The `salesData` object includes `status` before inserting into the database.

### Sales Table Separation
- **`_Table.jsx`** — Filters by `status: "completed"`, only completed sales shown.
- **`_HoldTable.jsx`** — Filters by `status: "hold"`, only held sales shown (route: `/inventory/sales/hold`).
- **`useSalesList.js`** — Accepts `params.status` and passes it as a condition to `getDataFromTable("sales", { status })` for offline filtering.

### Files Changed
| File | Change |
|------|--------|
| `electron/db.cjs` | Added `status` column |
| `src/modules/pos/common/Transaction.jsx` | `status` param in save flow |
| `src/common/hooks/useSalesList.js` | Added `status` filter support for offline queries |
| `src/modules/inventory/sales/_Table.jsx` | Filters `status: "completed"` only |
| `src/modules/inventory/sales/_HoldTable.jsx` | Filters `status: "hold"` only |

---

## 2. Edit Sale in POS Mode

### Requirement
When `configData.is_pos` is true, clicking **Edit** on a sale should open it in the POS bakery page with items and transaction data pre-populated (instead of the regular edit page).

### Flow

```
Sales Table (Edit click)
  → if configData.is_pos:
      1. Clear existing invoice_table_item records
      2. Parse sales_items JSON → insert each item into invoice_table_item
      3. Dispatch setEditingSale() to Redux store (checkout slice)
      4. Navigate to /pos/bakery
  → else:
      Navigate to /inventory/sales/edit/:id (existing behavior)
```

### Redux State (`checkout.editingSale`)
Stored via `setEditingSale` action in the `checkout` slice (`src/features/checkout.js`):
```json
{
  "id": 123,
  "customerId": 1,
  "customerName": "John",
  "customerMobile": "0123456789",
  "customer_address": "...",
  "salesById": 1,
  "discount": 0,
  "discount_type": "flat",
  "payments": "[...]",
  "status": "completed"
}
```
Cleared via `clearEditingSale` action after save/update.

### Pre-population on POS Page
- **`Checkout.jsx`** — `useEffect` watches `editingSale` from Redux and sets form values: `sales_by_id`, `discount`, `discount_type`, `payments`, `customer_id`.
- **`Transaction.jsx`** — `useEffect` watches `editingSale` from Redux and restores `customerObject` (name, mobile, address).

### Save/Update Behavior
- **`Transaction.jsx` → `handleOfflineSave`**:
  - If `editingSale` exists in Redux: **updates** the existing sale record (via `updateDataInTable`) instead of inserting a new one.
  - Dispatches `clearEditingSale()`, clears cart, and **redirects to sales list** (`APP_NAVLINKS.SALES`).
  - If not editing: inserts new sale as usual.

### UI Changes in Edit Mode
- **Save button** changes to **"Update"** with blue background (`#0077b6`) and `IconRefresh` icon.
- `isEditing` derived from `!!editingSale` Redux state.

### Files Changed
| File | Change |
|------|--------|
| `src/features/checkout.js` | Added `editingSale` state, `setEditingSale` & `clearEditingSale` actions |
| `src/modules/inventory/sales/_Table.jsx` | `handleEditInPos()`, dispatches `setEditingSale` |
| `src/modules/pos/common/Checkout.jsx` | Form pre-population from Redux `editingSale`, cleanup on unmount |
| `src/modules/pos/common/Transaction.jsx` | Customer restore, update logic, redirect, button text/icon — all via Redux |

---

## 3. Hold Sales Processing

### Requirement
Held sales appear on a dedicated Hold page (`/inventory/sales/hold`). Clicking **Process** loads the held sale into the POS bakery for completion — same flow as Edit in POS mode.

### Flow

```
Hold Table (Process click)
  1. Clear existing invoice_table_item records
  2. Parse sales_items JSON → insert each item into invoice_table_item
  3. Dispatch setEditingSale() to Redux store (checkout slice)
  4. Navigate to /pos/bakery
  → POS page pre-populates cart + transaction form
  → On save: updates the existing sale record, redirects to sales list
```

### Files Changed
| File | Change |
|------|--------|
| `src/modules/inventory/sales/_HoldTable.jsx` | Added `handleProcess()`, status filter `"hold"`, wired Process button |
| `src/common/hooks/useSalesList.js` | Added `status` condition for offline DB queries |

### Cleanup
- **`Checkout.jsx`** dispatches `clearEditingSale()` on unmount, so navigating away from POS without saving clears the editing state automatically.

---

## 4. Requisition Edit (API-Based)

### Requirement
Edit existing requisitions via API. Clicking **Edit** on the requisition table navigates to the edit form, fetches data from the API, populates the form and temp table, and submits via PATCH.

### API Endpoints
- **GET** `/api/inventory/requisition/:id` — fetch requisition data (via `useGetRequisitionByIdQuery`)
- **PATCH** `/api/inventory/requisition/:id` — update requisition (via `useUpdateRequisitionMutation`)

### Flow

```
_Table.jsx (Edit click)
  → navigate("/inventory/requisition/edit/:id")

EditIndex.jsx (mount)
  → useGetRequisitionByIdQuery(id) — fetch from API
  → Clear temp_purchase_products WHERE type="requisition"
  → Insert each requisition_item into temp_purchase_products
  → Populate form: vendor_id, invoice_date, expected_date, remark
  → useTempPurchaseProducts({ type: "requisition" }) renders items

EditIndex.jsx (submit)
  → Map temp items to PATCH payload
  → PATCH /api/inventory/requisition/:id
  → Clear temp items → navigate to requisition list

EditIndex.jsx (unmount / navigate away)
  → Clear temp_purchase_products WHERE type="requisition"

NewIndex.jsx (mount)
  → Clear temp_purchase_products WHERE type="requisition" (safety net)
```

### Stale Temp Items Solution
Three-layer cleanup prevents stale items from appearing in the wrong context:
1. **EditIndex unmount** — cleanup `useEffect` clears temp items when user navigates away
2. **NewIndex mount** — clears temp items on mount as a safety net
3. **EditIndex mount** — clears temp items before inserting fresh ones from API

### RTK Service Fix
- `updateRequisition` changed from `PUT` to `PATCH` with dynamic URL `${APP_APIS.REQUISITION}/${id}`

### Bug Fix
- `_Table.jsx` Edit menu was navigating to `PURCHASE_EDIT` instead of `REQUISITION_EDIT`

### UI Changes
- Save button shows **"Update"** when `isEditMode={true}` (already handled by `PaymentSection.jsx`)

### Files Changed
| File | Change |
|------|--------|
| `src/services/requisition.js` | `PUT` → `PATCH`, dynamic URL with `id` |
| `src/modules/inventory/requisition/_Table.jsx` | Fixed edit nav to `REQUISITION_EDIT` |
| `src/modules/inventory/requisition/EditIndex.jsx` | Full rewrite: API fetch, temp table, PATCH submit, cleanup on unmount |
| `src/modules/inventory/requisition/NewIndex.jsx` | Added temp table cleanup on mount |
