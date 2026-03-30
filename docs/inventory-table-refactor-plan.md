# Inventory Table Refactor Plan

## Problem

4 inventory `_Table.jsx` files are 70-75% identical (1,449 lines total). The duplication has caused bugs that went unnoticed because changes in one file weren't replicated to others.

## Bugs Found in Duplicated Code

1. **Purchase Return wrong edit path**: navigates to `PURCHASE_EDIT` instead of `PURCHASE_RETURN_EDIT`
2. **Requisition deletes from wrong table**: calls `deleteDataFromTable("purchase")` instead of `"requisition"`
3. **Purchase Return deletes from wrong table**: calls `deleteDataFromTable("purchase")` instead of correct table
4. **Purchase Return dead code**: imports `useCopyPurchaseMutation` + handlers but never renders Copy menu item; `console.log(entities)` left in production
5. **Sales stray hook**: `useDisclosure(false)` called without using return value
6. **Purchase Return modal title**: says "Purchase" instead of "Purchase Return"

## Solution: Shared InventoryTable with Config Object Pattern

One `InventoryTable` component in `src/modules/inventory/common/InventoryTable.jsx` accepts a `config` object. Each module's `_Table.jsx` becomes a thin wrapper (~70-85 lines) that defines its config.

### What the shared component handles (identical across all 4)

- State: page, selectedRow, loading, viewData, deletedIds, dataSource, search form
- `handleShowDetails()` — open modal with item details
- `handleDeleteClick()` — confirm modal, delete from DB, track deleted IDs
- `handleApprove()` / `handleCopy()` — confirm modal, call mutation, show notification
- JSX layout: KeywordSearch + SegmentedControl + DataTable + GlobalModal
- DataTable: classNames, pagination, row click, row highlight, height calculation

### What each module provides via config

| Property | Purpose | Example |
|----------|---------|---------|
| `moduleName` | Table name for delete operations | `"sales"`, `"purchase"`, `"requisition"` |
| `useData()` | Hook adapter normalizing data fetching to `{ data, total, isLoading }` | Wraps `useSalesList` or `useGetRequisitionQuery` |
| `getColumns()` | Column definitions including action column | Returns array of DataTable column objects |
| `onNewClick()` | Navigation for "New" button | `navigate(APP_NAVLINKS.PURCHASE_NEW)` |
| `newButtonLabel` | Translation key for button text | `"NewPurchase"` |
| `showDataSourceToggle` | Show online/offline SegmentedControl | `false` for Requisition |
| `modalSize` | GlobalModal size | `"80%"` or `"65%"` |
| `getModalTitle()` | Modal title builder | `` `${t("Purchase")}: ${viewData?.invoice}` `` |
| `renderDetails()` | Module's `__Details` component | `<Details loading={loading} viewData={viewData} />` |
| `useMutations()` | Optional hook returning `{ approve, copy }` | Returns RTK Query mutation triggers |
| `useExtraHooks()` | Optional hook for module-specific needs | Sales uses for Redux dispatch + configData |

### Module-specific differences handled by config

| Feature | Sales | Purchase | Requisition | Purchase Return |
|---------|-------|----------|-------------|-----------------|
| Data hook | `useSalesList` | `usePurchaseList` | `useGetRequisitionQuery` | `useGetPurchaseReturnQuery` |
| Online/offline toggle | Yes | Yes | No | No |
| Approve button | No | Yes | Yes | Yes |
| Copy action | No | Yes | Yes | No |
| Edit action | Commented out | Yes | Yes (if !restricted) | Yes |
| Delete action | Commented out | Yes | Yes (if !restricted) | Yes |
| Restricted statuses | N/A | N/A | `["generated", "approved"]` | N/A |
| Extra hooks | `useDispatch`, `useConfigData` | None | None | None |
| Modal size | 80% | 80% | 80% | 65% |

## Implementation Order

Each step is a separate commit for easy rollback:

1. **Create** `src/modules/inventory/common/InventoryTable.jsx` (~180 lines)
2. **Refactor Purchase** — most representative, exercises all shared features
3. **Refactor Requisition** — fix delete table bug, add RESTRICTED_STATUSES
4. **Refactor Purchase Return** — fix edit path, delete table, dead code, modal title
5. **Refactor Sales** — fix stray hook, move handleEditInPos to config

## Line Count

| File | Before | After |
|------|--------|-------|
| `common/InventoryTable.jsx` | 0 | ~180 |
| `sales/_Table.jsx` | 367 | ~75 |
| `purchase/_Table.jsx` | 385 | ~85 |
| `requisition/_Table.jsx` | 357 | ~85 |
| `purchase-return/_Table.jsx` | 340 | ~70 |
| **Total** | **1,449** | **~495** |

**66% reduction** (954 lines removed).

## Verification Checklist (per module)

- [ ] List loads with data
- [ ] Search by keyword works
- [ ] Date range filtering works
- [ ] Pagination works
- [ ] Row click opens correct details modal
- [ ] Each action menu item works (Show/Edit/Copy/Delete/Approve)
- [ ] Online/offline toggle works (where applicable)
- [ ] New button navigates correctly
