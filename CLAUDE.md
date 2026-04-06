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
