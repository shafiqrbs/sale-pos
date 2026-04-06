# useLocalProducts Hook Refactor — Declarative Split

## Overview

Refactored the monolithic `useLocalProducts` hook into 3 focused, purpose-built hooks to eliminate boilerplate in consumer components. The core problem: every consumer needed manual `useEffect` wrappers, `.then(setState)` chains, and shared `loading`/`error` state that collided between unrelated operations.

---

## Ideology

**Before (Imperative):** The old `useLocalProducts` hook exposed async functions (`getLocalProducts`, `getProduct`, `getProductCount`, `syncOnlineProductsToLocal`). Every consumer had to:
1. Call the async function inside a `useEffect`
2. Manage their own local state with `.then(setProducts)`
3. Share a single `loading`/`error` state across all operations (list fetch, single lookup, sync — all stomped on each other)

**After (Declarative — React Query pattern):** Three hooks, each with isolated state:
- `useLocalProductList` — pass params, get `{ products, totalCount, loading, error }` back. Auto-fetches when params change. No `useEffect` in consumers.
- `useLocalProductLookup` — imperative `getProduct(stockId)` with its own `loading`/`error`, for on-demand single lookups.
- `useSyncProducts` — imperative `syncOnlineProductsToLocal(params)` with its own `isSyncing`/`error`, decoupled from list display.

---

## New Files Created

### `src/common/hooks/useLocalProductList.js`

Declarative hook. Pass config object, get reactive data back.

```js
const { products, totalCount, loading, error, refetch } = useLocalProductList({
  condition: { category_id: 5 },       // filter condition (auto-strips null/undefined)
  propertyId: "id",                      // default "id", rarely changed
  queryOptions: { limit: 25, offset: 0, orderBy: "id ASC", search: {...} },
  enabled: true,                         // set false to skip fetching (like RTK Query's skip)
});
```

- Uses `JSON.stringify` of params as a stable dependency key — safe with object literals
- Fetches both products AND count in a single `Promise.all` (eliminates the dual-call pattern)
- Exposes `refetch()` for manual re-trigger (e.g., after "products-updated" event)

### `src/common/hooks/useLocalProductLookup.js`

Imperative hook for single product lookups by stock_id.

```js
const { getProduct, loading, error } = useLocalProductLookup();
const product = await getProduct(stockId);
```

- Own `loading`/`error` state, independent of any list hook
- No auto-fetching — purely on-demand

### `src/common/hooks/useSyncProducts.js`

Imperative hook for syncing online products to local SQLite.

```js
const { syncOnlineProductsToLocal, isSyncing, error } = useSyncProducts();
const result = await syncOnlineProductsToLocal({ type: "product", product_nature: "allstocks" });
```

- Contains `mapApiProductToLocalSchema` (moved from old hook)
- Uses `useLazyGetProductQuery` internally for paginated API fetching
- Does NOT auto-refresh the product list after sync (consumer calls `refetch()` from list hook if needed — cleaner separation of concerns)

---

## Files Changed — Before vs After

### 1. `src/modules/stock/Table.jsx` (Stock Table)

**Before:**
```js
import useLocalProducts from "@hooks/useLocalProducts.js";
// ...
const searchRef = useRef({ term: "" });
const {
  products, totalCount, getLocalProducts, getProductCount,
  syncOnlineProductsToLocal, loading, isSyncing,
} = useLocalProducts({ fetchOnMount: false });

const fetchLocalProductsPage = useCallback(async () => {
  const offset = (page - 1) * PER_PAGE;
  const term = searchRef.current.term?.trim() || "";
  const searchConditions = term ? { like: { display_name: term } } : undefined;
  await getLocalProducts({}, "id", { limit: PER_PAGE, offset, orderBy: "id ASC", ...searchConditions && { search: searchConditions } });
  await getProductCount({}, { ...searchConditions && { search: searchConditions } });
}, [page, getLocalProducts, getProductCount]);

useEffect(() => {
  if (effectiveDataSource === "offline") fetchLocalProductsPage();
}, [fetchLocalProductsPage, effectiveDataSource]);

useEffect(() => {
  window.addEventListener("products-updated", fetchLocalProductsPage);
  return () => window.removeEventListener("products-updated", fetchLocalProductsPage);
}, [fetchLocalProductsPage]);

const handleSearch = (data) => {
  searchRef.current.term = data?.term || "";
  setOnlineSearchTerm(data?.term || "");
  setPage(1);
  fetchLocalProductsPage();
};
```

**After:**
```js
import useLocalProductList from "@hooks/useLocalProductList.js";
import useSyncProducts from "@hooks/useSyncProducts.js";
// ...
const [offlineSearchTerm, setOfflineSearchTerm] = useState("");  // was searchRef

const offlineTerm = offlineSearchTerm.trim();
const offlineSearchConditions = offlineTerm ? { like: { display_name: offlineTerm } } : undefined;

const { products, totalCount, loading, refetch: refetchLocal } = useLocalProductList({
  queryOptions: {
    limit: PER_PAGE, offset: (page - 1) * PER_PAGE, orderBy: "id ASC",
    ...(offlineSearchConditions && { search: offlineSearchConditions }),
  },
  enabled: effectiveDataSource === "offline",
});

const { syncOnlineProductsToLocal, isSyncing } = useSyncProducts();

useEffect(() => {
  window.addEventListener("products-updated", refetchLocal);
  return () => window.removeEventListener("products-updated", refetchLocal);
}, [refetchLocal]);

const handleSearch = (data) => {
  setOfflineSearchTerm(data?.term || "");
  setOnlineSearchTerm(data?.term || "");
  setPage(1);  // React 18 batches these — hook auto-refetches
};
```

**What was removed:** `useRef`, `useCallback` for fetchLocalProductsPage, 2 useEffects (fetch on mount + fetch on page change), manual dual `getLocalProducts`/`getProductCount` calls.

---

### 2. `src/modules/pos/common/ProductList.jsx`

**Before:**
```js
import { useEffect, useState, useCallback } from "react";
import useLocalProducts from "@hooks/useLocalProducts";
// ...
const {
  products: allProducts, totalCount: totalProducts,
  getLocalProducts, getProductCount,
} = useLocalProducts({ fetchOnMount: false });

const fetchProductsPage = useCallback(async () => {
  const offset = (activePage - 1) * ITEMS_PER_PAGE;
  // ... build searchConditions from filter state ...
  await getLocalProducts({}, "id", { limit: ITEMS_PER_PAGE, offset, search: searchConditions, orderBy: "id ASC" });
  await getProductCount({}, { search: searchConditions });
}, [activePage, filter, getLocalProducts, getProductCount]);

useEffect(() => { fetchProductsPage(); }, [fetchProductsPage]);
useEffect(() => {
  window.addEventListener("products-updated", fetchProductsPage);
  return () => window.removeEventListener("products-updated", fetchProductsPage);
}, [fetchProductsPage]);
```

**After:**
```js
import { useEffect, useState } from "react";
import useLocalProductList from "@hooks/useLocalProductList";
// ...
// searchConditions derived inline from filter state (same logic, just not inside useCallback)

const {
  products: allProducts, totalCount: totalProducts, refetch: refetchProducts,
} = useLocalProductList({
  queryOptions: {
    limit: ITEMS_PER_PAGE, offset: (activePage - 1) * ITEMS_PER_PAGE,
    search: searchConditions, orderBy: "id ASC",
  },
});

useEffect(() => {
  window.addEventListener("products-updated", refetchProducts);
  return () => window.removeEventListener("products-updated", refetchProducts);
}, [refetchProducts]);
```

**What was removed:** `useCallback` for fetchProductsPage, `useEffect` for auto-fetch, `useCallback` import, dual `getLocalProducts`/`getProductCount` calls.

---

### 3. `src/modules/pos/common/Transaction.jsx`

**Before:**
```js
import useLocalProducts from "@hooks/useLocalProducts";
const { getProduct } = useLocalProducts({ fetchOnMount: false });
```

**After:**
```js
import useLocalProductLookup from "@hooks/useLocalProductLookup";
const { getProduct } = useLocalProductLookup();
```

**What changed:** Swapped hook. `getProduct` now has its own isolated `loading`/`error` (not shared with list operations that don't exist here).

---

### 4. `src/modules/pos/common/CheckoutTable.jsx`

Same change as Transaction:

**Before:** `import useLocalProducts` / `useLocalProducts({ fetchOnMount: false })`
**After:** `import useLocalProductLookup` / `useLocalProductLookup()`

---

### 5. `src/modules/inventory/requisition/form/InvoiceForm.jsx`

**Before:**
```js
import React, { useEffect, useState } from "react";
import useLocalProducts from "@hooks/useLocalProducts";
// ...
const [products, setProducts] = useState([]);
const { getLocalProducts } = useLocalProducts({ fetchOnMount: false });

useEffect(() => {
  const filterCondition = {
    vendor_id: itemsForm.values.vendor_id,
    category_id: selectedCategoryId ? selectedCategoryId : undefined,
  };
  getLocalProducts(filterCondition, "id", { orderBy: "product_name ASC" })
    .then((fetchedProducts) => { setProducts(fetchedProducts); });
}, [selectedCategoryId, itemsForm.values.vendor_id]);
```

**After:**
```js
import React, { useState } from "react";
import useLocalProductList from "@hooks/useLocalProductList";
// ...
const { products } = useLocalProductList({
  condition: {
    vendor_id: itemsForm.values.vendor_id,
    category_id: selectedCategoryId ? selectedCategoryId : undefined,
  },
  queryOptions: { orderBy: "product_name ASC" },
});
```

**What was removed:** `useState` for products, `useEffect` + `.then(setProducts)`, `useEffect` import.

---

### 6. `src/modules/inventory/purchase/form/InvoiceForm.jsx`

**Before:**
```js
import React, { useEffect, useMemo, useRef, useState } from "react";
import useLocalProducts from "@hooks/useLocalProducts";
// ...
const [ products, setProducts ] = useState([]);
const { getLocalProducts } = useLocalProducts({ fetchOnMount: false });

useEffect(() => {
  getLocalProducts({ category_id: selectedCategoryId }, "id", { orderBy: "product_name ASC" })
    .then((fetchedProducts) => { setProducts(fetchedProducts); });
}, [ selectedCategoryId ]);
```

**After:**
```js
import React, { useEffect, useMemo, useRef, useState } from "react";
import useLocalProductList from "@hooks/useLocalProductList";
// ...
const { products } = useLocalProductList({
  condition: { category_id: selectedCategoryId },
  queryOptions: { orderBy: "product_name ASC" },
});
```

**What was removed:** `useState` for products, `useEffect` + `.then(setProducts)`.

---

### 7. `src/modules/inventory/sales/form/InvoiceForm.jsx`

**Before:**
```js
import { useEffect, useState } from "react";
import useLocalProducts from "@hooks/useLocalProducts";
// ...
const [products, setProducts] = useState([]);
const { getLocalProducts } = useLocalProducts({ fetchOnMount: false });

useEffect(() => {
  getLocalProducts({ category_id: null }, "id", { orderBy: "product_name ASC" })
    .then((fetchedProducts) => { setProducts(fetchedProducts); });
}, []);
```

**After:**
```js
import { useState } from "react";
import useLocalProductList from "@hooks/useLocalProductList";
// ...
const { products } = useLocalProductList({
  queryOptions: { orderBy: "product_name ASC" },
});
```

**What was removed:** `useState` for products, `useEffect` + `.then(setProducts)`, `useEffect` import.

---

### 8. `src/modules/inventory/purchase/_Table.jsx`

**Before:**
```js
import useLocalProducts from "@hooks/useLocalProducts";
const { syncOnlineProductsToLocal } = useLocalProducts({ fetchOnMount: false });
```

**After:**
```js
import useSyncProducts from "@hooks/useSyncProducts";
const { syncOnlineProductsToLocal } = useSyncProducts();
```

---

## Files NOT Changed

- `src/common/hooks/useLocalProducts.js` — the old hook is kept intact but is no longer imported by any consumer. Safe to delete when confirmed working.

---

## How to Undo

Run from the project root:

```bash
git checkout HEAD -- \
  src/modules/stock/Table.jsx \
  src/modules/pos/common/ProductList.jsx \
  src/modules/pos/common/Transaction.jsx \
  src/modules/pos/common/CheckoutTable.jsx \
  src/modules/inventory/requisition/form/InvoiceForm.jsx \
  src/modules/inventory/purchase/form/InvoiceForm.jsx \
  src/modules/inventory/sales/form/InvoiceForm.jsx \
  src/modules/inventory/purchase/_Table.jsx

# Then delete the new hook files
rm src/common/hooks/useLocalProductList.js
rm src/common/hooks/useLocalProductLookup.js
rm src/common/hooks/useSyncProducts.js
```

If already committed, use `git revert <commit-hash>` instead.

## How to Redo

Provide this document to Claude and ask it to redo the refactor following the "After" patterns described above.
