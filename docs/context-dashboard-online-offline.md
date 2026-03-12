# Dashboard Online/Offline Feature - Session Context

## What Was Done

### 1. Added API Route Constant
**File:** `src/routes/routes.js`
- Added `DAILY_SUMMARY: "/inventory/report/daily-summary"` to `APP_APIS`

### 2. Created RTK Query Service for Daily Summary
**File:** `src/services/report.js` (new)
- Injects `getDailySummary` endpoint into the base `apiSlice`
- Exports `useGetDailySummaryQuery` hook
- Accepts `{ start_date, end_date }` params (format: `YYYY-MM-DD`)
- Uses `"Sales"` tag for cache

### 3. Modified `useDailyMatrixData` Hook
**File:** `src/common/hooks/useDailyMatrixData.js`
- Now accepts `{ offlineFetch = true }` parameter (defaults to offline — safe)
- **Offline mode (`offlineFetch: true`):** Original behavior preserved — queries local SQLite via `window.dbAPI`
- **Online mode (`offlineFetch: false`):** Uses `useGetDailySummaryQuery` + `useGetSalesQuery` (from `src/services/sales.js`), maps API response to same shape
- RTK Query hooks are called with `{ skip: offlineFetch }` so they don't fire when offline

### 4. Added Floating Toggle Button to Dashboard
**File:** `src/modules/dashboard/index.jsx`
- Local `dashboardOnline` state (default `false`)
- Reads `isOnline` from `useOutletContext()` (provided by Layout)
- Blocks switching to online if app's `isOnline` is `false` (shows notification)
- Floating `ActionIcon` at bottom-right (fixed position, `bottom: 60, right: 24, z-index: 1000`)
- Teal cloud icon = online, gray cloud-off icon = offline
- Tooltip + notification on toggle

---

## Codebase Architecture Understanding

### Tech Stack
- **Frontend:** React + Vite + Mantine UI + Redux Toolkit (RTK Query)
- **Desktop:** Electron with SQLite local database
- **Icons:** `@tabler/icons-react`
- **Notifications:** `@mantine/notifications`

### API Configuration
- **Base API slice:** `src/services/api.mjs`
  - `fetchBaseQuery` with `baseUrl` from `VITE_API_GATEWAY_URL` (`.env`: `https://posbackend.poskeeper.com/api`)
  - Headers: `Accept`, `Content-Type`, `X-Api-Key` (from `VITE_API_KEY`), `X-Api-User` (from local DB)
  - Tag types: User, Product, Sales, Purchase, POS, Core, Categories, InvoiceMode, Settings, Customers, Vendors, LocalStorageVendors

### Service Pattern (RTK Query)
All services inject endpoints into the base `apiSlice`:
```js
import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";
export const extendedXxxApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({ ... }),
});
export const { useXxxQuery } = extendedXxxApiSlice;
```
Existing services: `sales.js`, `purchase.js`, `product.js`, `pos.js`, `auth.js`, `settings.js`, `core/core.js`

### Store Configuration
- **File:** `src/app/store.js`
- Reducers: `apiSlice.reducer` + `checkoutReducer`
- Middleware: default + `apiSlice.middleware`
- `setupListeners(store.dispatch)` enabled

### Route Constants
- **File:** `src/routes/routes.js`
- `APP_APIS` = API endpoint paths (relative to base URL)
- `APP_NAVLINKS` = Frontend navigation paths
- `MASTER_APIS` = Full URL paths for splash/login

### Vite Path Aliases
Defined in `vite.config.js`:
- `@components` → `src/common/components`
- `@services` → `src/services`
- `@features` → `src/features`
- `@hooks` → `src/common/hooks`
- `@constants` → `src/common/constants`
- `@/` → `src/`

### Online/Offline System
- **Layout** (`src/common/components/layout/Layout.jsx`):
  - `useNetwork()` from `@mantine/hooks` detects real network
  - `useLocalStorage({ key: "network-preference", defaultValue: false })` = user toggle
  - Auto-sets offline if network drops
  - Passes `{ isOnline, toggleNetwork, mainAreaHeight, user }` via `<Outlet context={...} />`
- **Pattern in hooks:** Check `isOnline`, skip RTK Query when offline, fallback to `window.dbAPI`

### Local Database (Electron)
- **Preload:** `preload.cjs` exposes `window.dbAPI`
- **DB module:** `electron/db.cjs` — SQLite at `app.getPath("userData")/pos.db`
- **Key method:** `window.dbAPI.getDataFromTable(tableName, id?, orderBy?, options?)` — options support `{ search: { startsWith: { field: value } } }`
- **Tables:** users, license_activate, sales, purchase, core_products, core_customers, accounting_transaction_mode, config_data, etc.

### Dashboard Component Tree
```
Layout.jsx (provides isOnline via Outlet context)
  └── dashboard/index.jsx (floating toggle, manages dashboardOnline state)
        ├── SalesSummaryCard.jsx (totalSales, totalDiscount, totalPayment, totalInvoices)
        ├── TransactionModesCard.jsx (pie chart of payment methods)
        ├── TopSellingProductsCard.jsx (table: name, quantity, amount)
        └── TodaysOverviewCard.jsx (avg invoice, avg discount, collection rate)
```
All cards receive `{ dailyData, cardHeight }` props.

### Daily Summary API Response Shape
```
GET /api/inventory/report/daily-summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
{
  "message": "success",
  "status": 200,
  "data": {
    "sales": { totalInvoices, totalSales, total, totalPayment, totalDue, totalDiscount },
    "purchase": [{ totalInvoices, totalPurchase, total, totalPayment, totalDue, totalDiscount }],
    "methods": [],
    "transactionModes": [],
    "topSalesItem": [{ totalQuantity, totalAmount, salesPrice, name }]
  }
}
```

### Field Mapping (API → Hook Output)
| API Field | Hook Field |
|---|---|
| `data.sales.totalSales` | `totalSales` |
| `data.sales.totalDiscount` | `totalDiscount` |
| `data.sales.totalPayment` | `totalPayment` |
| `data.sales.totalDue` | `totalDue` |
| `data.sales.totalInvoices` | `totalInvoices` |
| `data.transactionModes` | `transactionModes` |
| `data.topSalesItem[].name` | `topProducts[].name` |
| `data.topSalesItem[].totalQuantity` | `topProducts[].totalQuantity` |
| `data.topSalesItem[].totalAmount` | `topProducts[].totalAmount` |
| `data.topSalesItem[].salesPrice` | `topProducts[].salesPrice` |
| Sales list from `GET /api/inventory/sales` | `salesList` |

### Hook Return Shape (both modes)
```js
{
  dailyData: {
    totalSales: number,
    totalDiscount: number,
    totalPayment: number,
    totalDue: number,
    totalInvoices: number,
    transactionModes: [{ name, amount, count }],
    topProducts: [{ name, totalQuantity, totalAmount, salesPrice }],
    salesList: [],
  },
  isLoading: boolean,
  error: any,
  refetch: () => void,
}
```

### Key Constraint
- Dashboard floating button can only switch to online if the app-level `isOnline` (from Layout outlet context) is `true`
- Default is always offline — offline fetching must never break
