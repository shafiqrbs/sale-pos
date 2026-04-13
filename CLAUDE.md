# Sale POS - Project Guidelines

## Memory

Project-specific learnings and feedback are stored in [`.claude/memory.md`](.claude/memory.md). Read it at the start of each session to avoid repeating past mistakes.

## Tech Stack

- **UI Framework**: Mantine v8 (`@mantine/core`, `@mantine/hooks`, `@mantine/modals`, `@mantine/form`)
- **State Management**: Redux Toolkit (RTK Query for API calls)
- **Platform**: Electron desktop app
- **Routing**: React Router
- **i18n**: react-i18next

## Project Structure

- `src/modules/` - Feature modules (inventory, pos, reports, core, stock)
- `src/services/` - RTK Query API service definitions
- `src/common/components/` - Shared components (layout, drawers, modals)
- `src/common/components/modals/` - Global reusable modals (use `GlobalModal` wrapper)
- `src/features/` - Redux slices
- `src/routes/routes.js` - Route definitions and `APP_APIS` / `APP_NAVLINKS` constants
- `src/hooks/` - Custom hooks

### Electron Main Process

The Electron main process is split into focused modules under `electron/`. Each file has a single responsibility — don't cross these boundaries.

- `index.cjs` (project root) — entry point. Creates windows, sets CSP, calls `initSchema()` then `registerIpcHandlers()` inside `app.whenReady()`.
- `preload.cjs` (project root) — context-bridge definitions. Exposes `window.dbAPI`, `window.deviceAPI`, `window.zoomAPI`, `window.authAPI`.
- `electron/connection.cjs` — owns the single `better-sqlite3` `Database` instance. Exports `{ db, close }`. Everything that touches the db imports from here.
- `electron/schema.cjs` — `CREATE TABLE` / `CREATE INDEX` DDL. Exports `initSchema()`, called once at startup. When adding a new table, add it here **and** add its name to `VALID_TABLES` in `validators.cjs`.
- `electron/validators.cjs` — SQL-injection guards (`validateTableName`, `validateIdentifier`, `validateSearchFields`, `VALID_SQL_OPERATORS`). Every dynamic table/column name must pass through these before reaching SQL.
- `electron/db.cjs` — CRUD helpers only (`upsertIntoTable`, `getDataFromTable`, `updateDataInTable`, `deleteDataFromTable`, `deleteManyFromTable`, `destroyTableData`, `clearAndInsertBulk`, `resetDatabase`, `getJoinedTableData`, `getTableCount`). No schema, no DDL, no auth.
- `electron/auth.cjs` — authentication (offline login, bcrypt verify against `core_users`). Exports `registerAuthHandlers()`.
- `electron/pos.cjs` — thermal/kitchen printing.
- `electron/ipcHandlers.cjs` — the only file that calls `ipcMain.handle()`. Split per concern: `registerDbHandlers`, `registerPosHandlers`, `registerAppHandlers`, plus calls `registerAuthHandlers` from `auth.cjs`. All wrapped in one `registerIpcHandlers()` that `index.cjs` calls.

**Rules when editing main-process code:**

- Never create a new `Database` instance — always import `db` from `connection.cjs`.
- Never call `ipcMain.handle()` outside `ipcHandlers.cjs`. If a module needs its own handlers, export a `registerXxxHandlers()` function and call it from `ipcHandlers.cjs`.
- Never build SQL with an unvalidated table or column name. Run it through `validators.cjs` first.
- Never call `JSON.parse` on a bcrypt hash or any user-supplied value — bcrypt output is a plain string.

## Patterns & Conventions

### Modal/Drawer State

Always use `useDisclosure` from `@mantine/hooks` for modal and drawer open/close state — never `useState(boolean)`.

```js
const [opened, { open, close }] = useDisclosure(false);
// Multiple modals: rename destructured values
const [damageOpened, { open: openDamage, close: closeDamage }] = useDisclosure(false);
```

### Notifications

Use `showNotification` from `@components/ShowNotificationComponent.jsx`.

### API Services

- Define endpoints in `src/services/` using RTK Query `apiSlice.injectEndpoints`
- API base paths are in `APP_APIS` from `@/routes/routes`
- Export hooks from the service file (e.g., `useGetPurchaseQuery`, `useAddPurchaseMutation`)

### Translations

Always wrap **every** user-facing text with `t()` from `useTranslation()`. **Never use raw string literals in JSX rendered output, props, or notification messages.**

- Translation files: `src/lang/en/translation.json` (English) and `src/lang/bn/translation.json` (Bangla)
- When adding any new UI text, add the key to **both** JSON files simultaneously
- Key naming: PascalCase, descriptive (e.g. `GrandTotal`, `StillDue`, `TransactionModeRequired`)
- Exceptions to translation: keyboard shortcut hints (`alt+s`), date format tokens (`DD-MM-YYYY`), CSS/prop values, technical example placeholders (e.g. printer model codes)

#### What Must Be Translated

- **Placeholders**: `placeholder={t("SearchVendorSupplier")}` — never `placeholder="Search vendor/supplier"`
- **Tooltips**: `tooltip={t("VendorRequired")}` — never `tooltip="Vendor is required"`
- **Error/validation messages**: `errorMessage={t("ProductRequired")}` — never `errorMessage="Product is required"`
- **Notification messages**: `showNotification(t("PurchaseAddedSuccessfully"), "teal")` — never raw strings in `showNotification()`
- **Titles & descriptions**: `title={t("SetupPrinter")}`, `description={t("PrinterNameDescription")}`
- **nothingFoundMessage**: `nothingFoundMessage={t("ChangeSearchTermProduct")}`
- **Labels in forms**: section headings, button text, input labels
- **Select dropdown labels**: `{ value: 'stableKey', label: t("Key") }` objects to keep stored values language-independent

#### Dynamic Translation with Interpolation

For messages containing dynamic values, use i18next interpolation:

```js
// Translation key: "InvoiceDeletedSuccess": "Invoice {{invoice}} deleted"
showNotification(t("InvoiceDeletedSuccess", { invoice: record.invoice }), "teal");
```

#### Non-Component Files (helpers, utils)

For validation helpers or utility files that are not React components, accept `t` as a parameter:

```js
// In helpers/request.js
export const vendorOverviewRequest = (t) => ({
  initialValues: { ... },
  validate: {
    vendor_id: (value) => (!value ? t("VendorRequired") : null),
  },
});

// In the component
const { t } = useTranslation();
const itemsForm = useForm(vendorOverviewRequest(t));
```

### Action Menus in Tables

Use Mantine `<Menu>` with `<ActionIcon>` trigger (`IconDotsVertical`). Wrap in `<Group>`. Always call `event.stopPropagation()` in menu item handlers.

### Global Modals

Place reusable modals in `src/common/components/modals/`. Wrap with `<GlobalModal>` component which handles loading overlay and consistent styling.

### JSON Parsing

Never call `JSON.parse` directly inside components or hooks. Always use a util from `@utils/index`:

- `parseJsonArray(value)` — parses a JSON string expected to be an array; returns `[]` on any failure or if the result is not an array.

Add new parse helpers to `src/common/utils/index.js` whenever a new shape is needed.

### Authentication

Login is **offline only**. The renderer calls `window.authAPI.loginUser({ username, password })`, which invokes the `auth-login-user` IPC channel handled by `electron/auth.cjs`. The main process looks up the user in `core_users`, verifies the bcrypt hash (12 rounds, native `bcrypt` module), and on success returns the user row (password stripped) in the shape `{ status: 200, data: <user> }`. On failure it returns `{ status: 401, message: <reason> }`.

- Bcrypt runs in the main process only — never import `bcrypt` in the renderer.
- Password hashes never cross the context bridge; `auth.cjs` strips `password` before returning.
- `core_users.password` is a bcrypt hash (12 rounds). Any seeding must hash passwords before insert — never store plaintext.
