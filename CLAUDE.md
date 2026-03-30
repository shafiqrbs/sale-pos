# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electron + React desktop POS (Point of Sale) application that operates in both offline (SQLite) and online (API) modes with data synchronization. Product name is "Sandra" / "POS App".

## Commands

```bash
npm run dev          # Vite dev server on port 3000 (renderer only)
npm run build        # Build React app to dist/
npm start            # Launch Electron app (requires prior build)
npm run dev-mac      # Run Vite + Electron together (macOS)
npm run dev-app      # Run Vite + Electron together (Linux/generic)
npm run lint         # ESLint
npm run format       # Prettier write
npm run format:check # Prettier check
npm run make         # Build platform installers via Electron Forge
npm run make-win     # Windows-specific build
```

Local dev workflow: `npm run build && npm start`, or use `npm run dev-mac` for hot-reloading with Electron.

## Architecture

### Process Model (Electron)

- **Main process** (`index.cjs`): Window management, SQLite database operations, thermal printer control. All DB and device access happens here.
- **Preload** (`preload.cjs`): Context bridge exposing three APIs to the renderer:
  - `window.dbAPI` — SQLite CRUD (upsert, get, update, delete, bulk insert, reset)
  - `window.deviceAPI` — Thermal printing (`thermalPrint`, `kitchenPrint`)
  - `window.zoomAPI` — Window zoom controls
- **Renderer** (`src/`): React app communicates with main process exclusively through these IPC bridges.

### Frontend Stack

- **React 19** with **HashRouter** (required for Electron `file://` protocol)
- **Mantine v8** for all UI components
- **Redux Toolkit + RTK Query** for state and API data fetching
- **React Compiler** enabled via Babel plugin
- **i18next** for internationalization (English + Bengali in `src/lang/`)

### Data Layer — Offline/Online Hybrid

The app can run fully offline using SQLite or online via REST API. Config flags (`is_sales_online`, `is_purchase_online`) control which mode each operation uses.

- **API base config**: `src/services/api.mjs` — RTK Query `apiSlice` with `X-Api-Key` and `X-Api-User` headers (user ID fetched from SQLite on every request)
- **API endpoints**: defined in `src/routes/routes.js` (`APP_APIS` object)
- **Service slices**: `src/services/*.js` — each injects endpoints into the base `apiSlice`
- **SQLite schema**: `electron/db.cjs` — tables auto-created on app start
- **Config sync**: `useConfigData` hook compares online config with local SQLite and updates if different

### Module Structure

```
src/
  modules/           # Feature areas (auth, pos, inventory, dashboard, report, stock, core)
  services/          # RTK Query API slices (one per domain)
  features/          # Redux slices (checkout cart state, user info)
  common/
    components/      # Shared UI (layout, modals, drawers, print formats, skeletons)
    hooks/           # Business logic hooks (useCartOperation, useSalesList, useConfigData, etc.)
    utils/           # Helpers and local-storage utilities
  routes/
    routes.js        # APP_NAVLINKS (frontend paths) + APP_APIS (backend endpoints)
    AppRoutes.jsx    # Route definitions
```

### Import Aliases (configured in vite.config.js + jsconfig.json)

`@components`, `@services`, `@features`, `@constants`, `@utils`, `@assets`, `@hooks`, `@modules`, `@` (src root)

### Auth Flow

1. **Activation** (`/activate`): License key validated via API, bulk data (users, products, customers, vendors, config) downloaded into SQLite
2. **Login** (`/login`): Credentials verified via API, user stored in SQLite `users` table, role-based routing to dashboard or POS

### Key Patterns

- Business logic lives in custom hooks (`src/common/hooks/`), components stay lean
- RTK Query handles all API calls — avoid raw Axios (exception: `getDataWithoutStore` in `api.mjs`)
- Print templates in `src/common/components/print-formats/`
- Thermal printer integration in `electron/pos.cjs`, invoked via `window.deviceAPI`
- No test framework configured — no unit/integration tests exist
