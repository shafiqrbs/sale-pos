# Hold Sale & POS Edit Feature

## Overview
Added ability to "hold" sales (save with hold status) and edit sales directly in the POS bakery interface.

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

### Sales Table UI
- **`_Table.jsx`** — Added a **Status** column after the Due column.
- Displays "hold" in orange and "completed" in green, with `tt="capitalize"`.

### Files Changed
| File | Change |
|------|--------|
| `electron/db.cjs` | Added `status` column |
| `src/modules/pos/common/Transaction.jsx` | `status` param in save flow |
| `src/modules/inventory/sales/_Table.jsx` | Status column in UI |

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
      3. Store sale metadata in localStorage("editing_sale")
      4. Navigate to /pos/bakery
  → else:
      Navigate to /inventory/sales/edit/:id (existing behavior)
```

### Data Stored in localStorage (`editing_sale`)
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

### Pre-population on POS Page
- **`Checkout.jsx`** — `useEffect` on mount reads `editing_sale` from localStorage and sets form values: `sales_by_id`, `discount`, `discount_type`, `payments`, `customer_id`.
- **`Transaction.jsx`** — `useEffect` on mount restores `customerObject` (name, mobile, address) from localStorage.

### Save/Update Behavior
- **`Transaction.jsx` → `handleOfflineSave`**:
  - If `editing_sale` exists in localStorage: **updates** the existing sale record (via `updateDataInTable`) instead of inserting a new one.
  - Clears cart, removes `editing_sale` from localStorage, and **redirects to sales list** (`APP_NAVLINKS.SALES`).
  - If not editing: inserts new sale as usual.

### UI Changes in Edit Mode
- **Save button** changes to **"Update"** with blue background (`#0077b6`) and `IconRefresh` icon.
- `isEditing` state is initialized from `localStorage.getItem("editing_sale")` on mount.

### Files Changed
| File | Change |
|------|--------|
| `src/modules/inventory/sales/_Table.jsx` | `handleEditInPos()`, conditional Edit click |
| `src/modules/pos/common/Checkout.jsx` | Form pre-population from localStorage |
| `src/modules/pos/common/Transaction.jsx` | Customer restore, update logic, redirect, button text/icon |
