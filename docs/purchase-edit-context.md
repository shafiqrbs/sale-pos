# Purchase Edit Mode — Implementation Context

This document captures the full architecture and every decision made while implementing
**offline edit mode for the Sales module**. Use it as the blueprint when implementing
the same feature for the Purchase module.

---

## 1. The Core Problem

The app is **fully offline, single-user, Electron + SQLite** (`electron/db.cjs`).

There are two kinds of "product list" state:

| Context | Storage |
|---|---|
| **Create mode** | `temp_sales_products` / `temp_purchase_products` SQLite table |
| **Edit mode** | **In-memory React state only** — the temp table is NOT used |

The original `EditIndex.jsx` was a copy of `NewIndex.jsx` and was creating a new sales
record instead of updating the existing one. The entire item pipeline was wired to the
temp table which caused two problems in edit mode:
- Reading stale/wrong products from the temp table
- Submitting a new row instead of updating the existing one

---

## 2. What Was Changed (Sales Module)

### 2.1 New Hook — `src/common/hooks/useGetSale.js`

Created as a **dedicated default export** (not bundled inside `useSalesList`).

```js
// usage
const { sale, isLoading, error, refetch } = useGetSale(id);
```

- Takes a numeric or string `id` from `useParams()`
- Fetches via `window.dbAPI.getDataFromTable("sales", { id: Number(id) })`
- Normalises: `Array.isArray(result) ? result[0] : result`
- Has `refreshKey` state + `useCallback` refetch pattern (same as all other local hooks)

**Why separate file:** `useSalesList.js` is about fetching a paginated list (and can use
the online RTK Query path). Single-record fetching is always local-only, so it belongs
in its own file.

---

### 2.2 Extended Hook — `src/common/hooks/useGetCategories.js`

Extended to optionally accept `{ categoryId }`.

```js
// all categories (original behaviour)
const { categories } = useGetCategories();

// single category by id
const { category } = useGetCategories({ categoryId: 5 });
```

- When `categoryId` is set: fetches `getDataFromTable("categories", { id: Number(categoryId) })`
  and returns `{ category, categories: null, ... }`
- When not set: original behaviour — returns `{ categories, category: null, ... }`
- The `useEffect` dependency is `[categoryId]` so it re-fetches when it changes

---

### 2.3 `ItemsTableSection.jsx` (Sales) — Optional Callback Props

Added four **optional** callback props. When provided (edit mode) they are called instead
of the DB write + `refetch`. When absent (create mode) original behaviour is unchanged.

```
onQuantityChange(itemId, updatedData)   — replaces updateDataInTable("temp_sales_products", ...)
onPriceChange(itemId, updatedData)      — same
onDiscountChange(itemId, updatedData)   — same
onRemoveItem(itemId)                    — replaces deleteDataFromTable("temp_sales_products", ...)
```

`updatedData` is the already-calculated object (e.g. `{ quantity, sub_total }`) so the
parent just merges it into state — no re-calculation needed.

```js
// pattern in each handler:
if (onQuantityChange) {
    onQuantityChange(itemId, updatedData);
} else {
    await window.dbAPI.updateDataInTable("temp_sales_products", { id: itemId, data: updatedData });
    refetch();
}
```

---

### 2.4 `Overview.jsx` (Sales) — Pass-Through Props

Added the four optional props to the function signature and forwards them to
`ItemsTableSection`. No logic lives here — it is purely a pass-through.

Also added `isEditMode = false` for the Save button label (see §2.6).

---

### 2.5 `InvoiceForm.jsx` (Sales) — Optional `onAddItem` Prop

```js
export default function InvoiceForm({ refetch, onAddItem }) { ... }
```

Inside `handleAddItemToSalesForm`:

```js
if (onAddItem) {
    // edit mode — push to parent state, never touch temp table
    onAddItem(newItem);
} else {
    // create mode — write to DB as before
    await window.dbAPI.upsertIntoTable("temp_sales_products", newItem);
    refetch();
}
```

Also: `categories` from `useGetCategories()` is used here to resolve `category_name`
from `selectedProduct.category_id` before building `newItem`.

`newItem` shape (complete, as saved to temp table / passed to edit state):
```js
{
    product_id, display_name, sales_price, price, mrp, percent,
    stock, quantity, unit_name, purchase_price, average_price,
    sub_total, unit_id,
    category_id,       // ← added
    category_name,     // ← added
    type: "sales",
}
```

---

### 2.6 `PaymentSection.jsx` (Sales) — `isEditMode` + Auto-Sync Fix

**Two changes:**

**A. Save button label**

```js
isEditMode = false   // new prop
// ...
{isEditMode ? "Update" : "Save"}
```

**B. Critical bug fix — paymentAmount auto-sync**

This effect fires every time `grandTotal` changes:

```js
useEffect(() => {
    if (isEditMode) return;    // ← guard added
    if (!isSplitPaymentActive) {
        salesForm.setFieldValue("paymentAmount", grandTotal);
        ...
    }
}, [grandTotal, isSplitPaymentActive]);
```

**Why this was broken in edit mode:**
1. Page mounts → `editSaleItems = []` → `grandTotal = 0`
2. Effect fires → overwrites the correctly pre-populated `paymentAmount` with `0`
3. Items load later → effect fires again with the real value → it corrects itself
4. Result: the field shows `0` on first render and only fixes after any change

The guard `if (isEditMode) return;` stops this from running at all in edit mode.
`paymentAmount` is pre-populated by `salesForm.setValues(...)` from the stored sale.

---

### 2.7 `EditIndex.jsx` (Sales) — Full Rewrite

This is the main file. Key decisions and patterns:

#### State

```js
const [editSaleItems, setEditSaleItems] = useState([]);
const [isEditInitialized, setIsEditInitialized] = useState(false);
const editItemIdCounter = useRef(0);      // synthetic ids for items
const originalSnapshotRef = useRef(null); // for reset + qty restoration
const withPosPrintRef = useRef(false);    // POS print flag
```

#### Initialization (once, on sale load)

```js
useEffect(() => {
    if (!sale || isEditInitialized) return;
    // ...
    setIsEditInitialized(true);
}, [sale]);
```

- Parses `JSON.parse(sale.sales_items || "[]")`
- Assigns synthetic `id` via `editItemIdCounter.current += 1` (because the same product
  can appear multiple times — `product_id` alone is not a safe key)
- Sets `price: item.mrp ?? item.sales_price` — `mrp` is the base for per-item discount
  calculations; `sales_price` may be discounted so must NOT be used as the base
- Maps `discount_type` from DB format (`"Flat"/"Percentage"/"Coupon"`) back to form
  format (`"flat"/"percentage"/"coupon"`)
- Stores `originalSnapshotRef` (copy of items + form values) for reset and for product
  quantity restoration on save

#### Item handlers (all update local state only)

```js
// single handler works for qty, price, and discount — all pass pre-calculated updatedData
const handleEditItemUpdate = (itemId, updatedData) => {
    setEditSaleItems((prev) => prev.map(
        (item) => item.id === itemId ? { ...item, ...updatedData } : item
    ));
};

const handleEditRemoveItem = (itemId) => {
    setEditSaleItems((prev) => prev.filter((item) => item.id !== itemId));
};

const handleAddEditItem = (newItem) => {
    editItemIdCounter.current += 1;
    setEditSaleItems((prev) => [...prev, { ...newItem, id: editItemIdCounter.current }]);
};
```

#### Product quantity restoration on save

Because the app is single-user offline, a simple two-pass approach is used:

```
1. Restore original quantities:  product.quantity += originalItem.quantity
                                  product.total_sales -= originalItem.quantity
2. Deduct new quantities:         product.quantity -= newItem.quantity
                                  product.total_sales += newItem.quantity
```

This correctly handles:
- Items removed from the sale (only restored, never deducted)
- Items added to the sale (only deducted, never restored)
- Items with changed quantities (both restored and re-deducted)
- Items that are the same (net zero change)

#### Submit

```js
await window.dbAPI.updateDataInTable("sales", {
    condition: { id: Number(saleId) },
    data: salesData,
});
```

- `invoice` is kept from `sale.invoice` — never regenerated
- `salesItemsForDb` shape stored in the `sales_items` JSON column:
```js
{
    product_id, display_name, quantity,
    mrp,            // ← always stored separately from sales_price
    sales_price,
    sub_total,
    category_id,    // ← added
    category_name,  // ← added
}
```

#### After successful save

- `originalSnapshotRef` is updated to the newly saved state (so the next save uses
  the correct baseline, and reset also reflects the last-saved state)
- Navigates to `APP_NAVLINKS.SALES`

#### Reset

```js
const handleReset = () => {
    const snapshot = originalSnapshotRef.current;
    setEditSaleItems(snapshot.parsedItems.map((item) => ({ ...item })));
    salesForm.setValues(snapshot.formValues);
    setResetKey((prev) => prev + 1);
};
```

Restores to the **original loaded state** (not to a blank form). No temp table cleanup
needed.

#### JSX wiring

```jsx
<InvoiceForm refetch={() => {}} onAddItem={handleAddEditItem} />
<SalesOverview
    salesProducts={editSaleItems}     // ← local state, not temp table
    refetch={() => {}}                // ← no-op, not needed
    onQuantityChange={handleEditItemUpdate}
    onPriceChange={handleEditItemUpdate}
    onDiscountChange={handleEditItemUpdate}
    onRemoveItem={handleEditRemoveItem}
    isEditMode={true}
/>
```

---

### 2.8 `sales_items` JSON Column — Field Additions

`mrp` and `category_id`/`category_name` are now always stored in the JSON.

- **`mrp`**: the original MRP at the time of sale. `sales_price` may be lower due to
  per-item discount. Storing both lets edit mode correctly set the discount base.
- **`category_id` / `category_name`**: resolved at item-add time in `InvoiceForm` using
  `useGetCategories()` and stored so the table can display the category column without
  a join.

Backward compatibility: `price: item.mrp ?? item.sales_price` — if an older sale record
has no `mrp` stored, it gracefully falls back to `sales_price`.

---

### 2.9 `_Table.jsx` (Sales) — Delete Menu Item

Added delete with confirmation:
- Menu item (red, `IconTrash`) in the existing action dropdown
- `rowToDelete` state + `deleteConfirmOpened` disclosure
- On confirm: `deleteDataFromTable("sales", { id })`, then pushes the id into a local
  `deletedSaleIds` Set — the DataTable filters this set so the row disappears instantly
  without a page reload

---

### 2.10 `ItemsTableSection.jsx` (both Sales and Purchase) — Category Column

Added a `"Category"` column right after the `"Product"` column:

```js
{
    accessor: "category_name",
    title: "Category",
    textAlign: "center",
    width: 120,
    render: (record) => (
        <Text size="sm" c="dimmed">{record.category_name || "—"}</Text>
    ),
}
```

---

## 3. Database Layer Reference

All DB calls go through `window.dbAPI` (Electron IPC exposed from `electron/db.cjs`).

| Method | Signature | Notes |
|---|---|---|
| `getDataFromTable` | `(table, condition?, property?, queryOptions?)` | Returns array or single object |
| `updateDataInTable` | `(table, { id?, condition?, data })` | Use `condition: { id }` for named conditions |
| `upsertIntoTable` | `(table, data)` | INSERT OR REPLACE on `id` |
| `deleteDataFromTable` | `(table, idOrCondition)` | Pass object for multi-field conditions |

---

## 4. Purchase Module — Current State (before any edit work)

### 4.1 Differences vs Sales

| Concern | Sales | Purchase |
|---|---|---|
| Temp table | `temp_sales_products` | `temp_purchase_products` |
| Main local table | `sales` | `purchase` ✅ (already exists — see §4.2) |
| Items JSON column | `sales_items` (TEXT, JSON) | `purchase_items` (TEXT, JSON) |
| Item price field | `sales_price` | `purchase_price` |
| Discount model | Global (flat/percentage/coupon) + per-item percent | Global only (flat or percentage toggle) |
| Payment model | Multi-payment / split payment | Single `transaction_mode_id` only |
| Party field | `customerId` / `customerName` | No vendor stored locally yet — API payload only |
| Create path | Local-only via `upsertIntoTable("sales", ...)` | **Online-only** via `useAddPurchaseMutation` |
| List path | Online (`useGetSalesQuery`) or offline local | **Online-only** via `useGetPurchaseQuery` |
| List hook | `useSalesList` (online/offline hybrid) | No equivalent — direct RTK Query in `_Table.jsx` |

### 4.2 Local `purchase` Table — Already Exists

The `purchase` table **already exists** in `electron/db.cjs` (lines 237–266).
Schema:

```sql
CREATE TABLE IF NOT EXISTS purchase (
    id INTEGER PRIMARY KEY,
    created DATE DEFAULT CURRENT_DATE,
    invoice TEXT,
    sub_total REAL,
    total REAL,
    payment REAL,
    discount REAL,
    discount_calculation REAL,
    discount_type TEXT,
    approved_by_id INTEGER,
    customerId INTEGER,
    customerName TEXT,
    customerMobile TEXT,
    createdByUser TEXT,
    createdByName TEXT,
    createdById INTEGER,
    process TEXT,
    mode_name TEXT,
    customer_address TEXT,
    balance REAL,
    purchase_items TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Key observations vs `sales` table:
- Has `purchase_items` TEXT column (JSON) — mirrors `sales_items`
- Has `customerId`/`customerName` not `vendorId`/`vendorName` — the vendor fields
  used in the API payload (`vendor_id`, `vendor_name`, etc.) are **not stored locally**
  and need to be added to the local table if vendor info must persist offline
- No `vendor_id`, `vendor_name`, `vendor_mobile`, `vendor_email` columns currently
- No `multi_transaction` or `payments` columns (purchase only has single payment mode)
- `mode_name` is present and is sufficient for single transaction mode

---

## 5. Phase 1 — Make Purchase Behave Like Sales (Online/Offline Parity)

This must happen **before** building edit mode. Sales shows local data when offline and
online data when online. Purchase currently shows nothing offline — it only uses the
online RTK Query. This phase brings purchase to parity.

### 5.1 What Sales Does (the model to copy)

```
Online:  useGetSalesQuery(params) via RTK Query  →  shows server data
Offline: window.dbAPI.getDataFromTable("sales")  →  shows local SQLite data
```

The hook (`useSalesList`) checks `useNetwork()` from `@mantine/hooks` and a caller-
supplied `offlineFetch` flag:

```js
const shouldUseOffline = offlineFetch || !networkStatus.online;
```

When offline: RTK Query is `skip`ped entirely, local fetch runs instead.
Returns a normalised `{ status, total, data }` object in both paths so consumers
don't need to change.

### 5.2 New Hook — `src/common/hooks/usePurchaseList.js`

Exact mirror of `useSalesList.js`. Differences:

- Import `useGetPurchaseQuery` from `@services/purchase` instead of `useGetSalesQuery`
- Query local table `"purchase"` instead of `"sales"`
- Return key is `purchases` instead of `sales`

```js
// full structure
export default function usePurchaseList({ params, offlineFetch = false } = {}) {
    const networkStatus = useNetwork();
    const shouldUseOffline = offlineFetch || !networkStatus.online;

    const { data: purchasesResponse, isLoading: isOnlineLoading, isFetching, error: onlineError }
        = useGetPurchaseQuery(params, { skip: shouldUseOffline });

    const [localPurchases, setLocalPurchases] = useState(null);
    const [isLocalLoading, setIsLocalLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

    useEffect(() => {
        if (shouldUseOffline) {
            const fetchLocalPurchases = async () => {
                setIsLocalLoading(true);
                setLocalError(null);
                try {
                    const purchasesData = await window.dbAPI.getDataFromTable("purchase");
                    setLocalPurchases(purchasesData);
                } catch (error) {
                    console.error("Error fetching local purchases:", error);
                    setLocalError(error);
                } finally {
                    setIsLocalLoading(false);
                }
            };
            fetchLocalPurchases();
        }
    }, [shouldUseOffline]);

    if (shouldUseOffline) {
        const offlinePurchasesResponse = localPurchases
            ? { status: 200, total: Array.isArray(localPurchases) ? localPurchases.length : 0, data: localPurchases }
            : null;
        return { purchases: offlinePurchasesResponse, isLoading: isLocalLoading, error: localError };
    }

    return { purchases: purchasesResponse, isLoading: isOnlineLoading || isFetching, error: onlineError };
}
```

### 5.3 Update `_Table.jsx` (Purchase) — Use the New Hook

Currently:
```js
const { data: purchaseData, isLoading } = useGetPurchaseQuery({ params: { ... } });
```

Replace with:
```js
const { isOnline } = useOutletContext();    // already destructured for mainAreaHeight
const { purchases: purchaseData, isLoading } = usePurchaseList({
    params: { term: ..., start_date: ..., end_date: ..., page, offset: PER_PAGE },
    offlineFetch: !isOnline,
});
```

The rest of the table component (`purchaseData?.data`, `purchaseData?.total`) stays
the same — same shape as the online response.

### 5.4 Update `NewIndex.jsx` (Purchase) — Save Locally First, Then API

Currently `NewIndex` **only** calls `useAddPurchaseMutation` and does nothing local.
The purchase never lands in the local `purchase` table.

Change: after a successful API response (online) **or** when offline, write to local DB.

**Online path (keep API call, add local write after):**
```js
const response = await addPurchase(payload).unwrap();
if (response.data) {
    // write to local purchase table for offline availability
    await window.dbAPI.upsertIntoTable("purchase", localPurchaseRecord);
    ...
}
```

**Offline path (skip API, write local only):**
```js
if (!isOnline) {
    await window.dbAPI.upsertIntoTable("purchase", localPurchaseRecord);
    ...
}
```

`localPurchaseRecord` shape — maps the API payload to the `purchase` table columns:
```js
const localPurchaseRecord = {
    invoice: generateInvoiceId(),         // or use the one returned from API
    sub_total: subTotal,
    total: total,
    payment: Number(formValues.paymentAmount),
    discount: Number(formValues.discountAmount) || 0,
    discount_calculation: discountValue,
    discount_type: formValues.isDiscountPercentage ? "Percentage" : "Flat",
    approved_by_id: user?.id ?? null,
    createdByUser: user?.username ?? "",
    createdById: user?.id ?? null,
    process: "",
    mode_name: selectedTransactionModeName,   // resolve from transactionModeId
    purchase_items: JSON.stringify(purchaseItemsForDb),
    created: formatDateTime(new Date()),
};
```

`purchaseItemsForDb` shape (already set in current code, just needs `mrp`/`category_*`):
```js
{
    product_id, display_name,
    quantity,
    mrp,                      // ← already set in InvoiceForm
    purchase_price,
    sales_price,
    sub_total,
    category_id,              // ← already set in InvoiceForm
    category_name,            // ← already set in InvoiceForm
}
```

Note: the `purchase` table has no `vendor_id`/`vendor_name` columns. If vendor info
must be shown offline, those columns need to be added to `electron/db.cjs` before this
phase. Otherwise vendor will be `null` in offline view — acceptable if you only need
financials offline.

### 5.5 `useNetwork` / `isOnline` in `NewIndex.jsx`

`NewIndex` does not currently read network status. Add:

```js
import { useNetwork } from "@mantine/hooks";
const networkStatus = useNetwork();
const isOnline = networkStatus.online;
```

Or read it from `useOutletContext()` if the layout already provides it (check `Layout.jsx`
— sales `_Table.jsx` reads `isOnline` from `useOutletContext`).

---

## 6. Phase 2 — Purchase Edit Mode

All of Phase 1 must be complete before starting Phase 2. Edit mode reads from the local
`purchase` table, so that table must actually have data in it.

### 6.1 New Hook — `src/common/hooks/useGetPurchase.js`

Exact mirror of `useGetSale.js`. Queries `"purchase"` table (not `"purchases"`).

```js
export default function useGetPurchase(id) {
    // window.dbAPI.getDataFromTable("purchase", { id: Number(id) })
}
```

### 6.2 Route to Add — `AppRoutes.jsx` + `routes.js`

```jsx
// AppRoutes.jsx
<Route path="purchase">
    <Route index element={<PurchaseIndex />} />
    <Route path="new" element={<PurchaseNewIndex />} />
    <Route path="edit/:id" element={<PurchaseEditIndex />} />
</Route>
```

```js
// routes.js — APP_NAVLINKS
PURCHASE_EDIT: "/inventory/purchase/edit",
```

### 6.3 `ItemsTableSection.jsx` (Purchase) — Callback Props to Add

Add the same optional override pattern as sales:

```
onQuantityChange(itemId, updatedData)   — replaces upsertIntoTable("temp_purchase_products", ...)
onPriceChange(itemId, updatedData)      — same
onRemoveItem(itemId)                    — replaces deleteDataFromTable("temp_purchase_products", ...)
```

Note: purchase uses `upsertIntoTable` (not `updateDataInTable`) for temp item changes.
The guard pattern is the same regardless.

Purchase does not have per-item `percent` / discount input, so `onDiscountChange` is
not needed.

### 6.4 `InvoiceForm.jsx` (Purchase) — `onAddItem` Prop

Same as sales. Add `onAddItem` prop. `categories` and `useGetCategories()` are already
present. The `newItem` already includes `category_id`/`category_name`.

```js
export default function InvoiceForm({ refetch, onAddItem }) { ... }

// inside handleAddItemToPurchaseForm:
if (onAddItem) {
    onAddItem(newItem);
} else {
    await window.dbAPI.upsertIntoTable("temp_purchase_products", newItem);
    refetch();
}
```

### 6.5 `Overview.jsx` (Purchase) — Pass-Through Props

Add to function signature and forward to `ItemsTableSection`:

```js
onQuantityChange, onPriceChange, onRemoveItem, isEditMode = false
```

Also pass `isEditMode` to `PaymentSection`.

### 6.6 `PaymentSection.jsx` (Purchase) — `isEditMode` + Save Button

Add `isEditMode = false` prop. Change save button label:

```jsx
{isEditMode ? "Update" : t("Save")}
```

Check if there is a `paymentAmount` auto-sync `useEffect` (like the one that was broken
in sales `PaymentSection`). If yes, add the same guard:

```js
useEffect(() => {
    if (isEditMode) return;    // ← guard
    salesForm.setFieldValue("paymentAmount", grandTotal);
    ...
}, [grandTotal, ...]);
```

### 6.7 `purchase/EditIndex.jsx` — File to Create

Mirror of `src/modules/inventory/sales/EditIndex.jsx`. Key differences:

**Imports:**
```js
import useGetPurchase from "@hooks/useGetPurchase";
import { vendorOverviewRequest } from "./helpers/request";
import PurchaseOverview from "./Overview";
```

**State:** identical pattern — `editPurchaseItems`, `isEditInitialized`,
`editItemIdCounter`, `originalSnapshotRef`.

**Initialization — parse `purchase.purchase_items`:**
```js
const parsedItems = JSON.parse(purchase.purchase_items || "[]").map((item) => {
    editItemIdCounter.current += 1;
    return {
        ...item,
        id: editItemIdCounter.current,
        price: item.mrp ?? item.purchase_price,   // base for price display
        percent: 0,
        stock: 0,
        average_price: item.average_price ?? 0,
        unit_name: item.unit_name ?? "",
    };
});
```

**Form population — map purchase columns to `vendorOverviewRequest` initial values:**
```js
const discountTypeMapped = purchase.discount_type === "Percentage"
    ? true    // isDiscountPercentage
    : false;

salesForm.setValues({
    vendor_id: "",              // not stored locally yet — will be blank in edit
    vendorName: "",             // same
    vendorPhone: "",            // same
    vendorEmail: "",            // same
    purchaseDate: purchase.created ? new Date(purchase.created) : new Date(),
    purchaseNarration: "",
    discountAmount: purchase.discount ?? 0,
    isDiscountPercentage: discountTypeMapped,
    paymentAmount: purchase.payment ?? 0,
    transactionModeId: "",      // not stored locally yet
    transactionMode: purchase.mode_name ?? "",
});
```

Note: vendor and transaction mode are not stored in the local `purchase` table columns
yet. If they are required in edit mode, those columns must be added to the DB schema in
`electron/db.cjs` as part of Phase 1.

**Product quantity restoration — identical two-pass logic:**
```
1. Restore: product.quantity += originalItem.quantity
2. Deduct:  product.quantity -= newItem.quantity
```

**Submit:**
```js
await window.dbAPI.updateDataInTable("purchase", {
    condition: { id: Number(purchaseId) },
    data: purchaseData,
});
```

Keep `purchase.invoice` unchanged — do not regenerate.

`purchaseItemsForDb` shape:
```js
{
    product_id, display_name, quantity,
    mrp,
    purchase_price,
    sales_price,
    sub_total,
    category_id,
    category_name,
}
```

**Reset:** same snapshot pattern — re-seeds `editPurchaseItems` and form values from
`originalSnapshotRef`.

**JSX:**
```jsx
<InvoiceForm refetch={() => {}} onAddItem={handleAddEditItem} />
<PurchaseOverview
    purchaseProducts={editPurchaseItems}
    refetch={() => {}}
    onQuantityChange={handleEditItemUpdate}
    onPriceChange={handleEditItemUpdate}
    onRemoveItem={handleEditRemoveItem}
    isEditMode={true}
    ...
/>
```

After save: navigate to `APP_NAVLINKS.PURCHASE`.

### 6.8 `_Table.jsx` (Purchase) — Edit Menu Item

Add to the existing action dropdown (already has Show / Approve / Copy / Delete):

```jsx
<Menu.Item
    onClick={(e) => {
        e.preventDefault();
        navigate(`${APP_NAVLINKS.PURCHASE_EDIT}/${data.id}`);
    }}
    w="140"
>
    <Flex gap={4} align="center">
        <IconEdit size={18} />
        <Text size="sm">{t("Edit")}</Text>
    </Flex>
</Menu.Item>
```

---

## 7. Full Checklist

### Phase 1 — Offline Parity for Purchase List + Create

- [ ] Create `src/common/hooks/usePurchaseList.js` (mirror of `useSalesList.js`)
- [ ] Update `purchase/_Table.jsx` to use `usePurchaseList` instead of direct `useGetPurchaseQuery`
- [ ] Update `purchase/NewIndex.jsx` to write to local `purchase` table after API success
- [ ] Decide: add `vendor_id`/`vendor_name`/`transaction_mode_id` columns to `purchase` table in `electron/db.cjs` if offline vendor display is needed
- [ ] Verify `purchase_items` JSON stored in local `purchase` table includes `mrp`, `category_id`, `category_name`

### Phase 2 — Purchase Edit Mode

- [ ] Create `src/common/hooks/useGetPurchase.js`
- [ ] Add `PURCHASE_EDIT` to `routes.js` + `AppRoutes.jsx`
- [ ] Add callback props to `purchase/ItemsTableSection.jsx`
- [ ] Add `onAddItem` prop to `purchase/form/InvoiceForm.jsx`
- [ ] Add pass-through props + `isEditMode` to `purchase/Overview.jsx`
- [ ] Add `isEditMode` + save button label + paymentAmount guard to `purchase/PaymentSection.jsx`
- [ ] Create `purchase/EditIndex.jsx`
- [ ] Add Edit menu item to `purchase/_Table.jsx`

---

## 6. Patterns and Rules Always Applied

- **Variable names are always full words** — no `q`, `d`, `i`, `v`, etc.
- **Comments start lowercase**, prefixed with `// ===============` and suffixed with ` ===============`
- **shadcn components** — ask the user to install; never replicate them manually
- **Package manager** — scan `package.json` for the manager in use before running installs
- **`useGetSale` / `useGetPurchase`** — always a dedicated file, never bundled into a list hook
- **`useGetCategories`** — shared hook, pass `{ categoryId }` for single-item lookup
- **`originalSnapshotRef`** is a `useRef`, not state — no re-render on update, and it
  survives function closures correctly
- **`editItemIdCounter`** is a `useRef` counter, not `Date.now()` or `Math.random()` —
  deterministic, no collisions, works with the same product appearing multiple times
