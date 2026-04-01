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
Always wrap user-facing text with `t()` from `useTranslation()`.

### Action Menus in Tables
Use Mantine `<Menu>` with `<ActionIcon>` trigger (`IconDotsVertical`). Wrap in `<Group>`. Always call `event.stopPropagation()` in menu item handlers.

### Global Modals
Place reusable modals in `src/common/components/modals/`. Wrap with `<GlobalModal>` component which handles loading overlay and consistent styling.
