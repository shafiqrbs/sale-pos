# Project Memory

## Feedback

### Always use useDisclosure for modals
Never use `useState(boolean)` for modal/drawer state — always use `useDisclosure` from `@mantine/hooks`.

**Why:** User explicitly corrected this — it's a project convention enforced across the codebase.

**How to apply:** Any time you need to control modal/drawer visibility, use:
```js
const [opened, { open, close }] = useDisclosure(false);
```

### Always wrap user-facing text with t()
Every string visible to the user in JSX must be wrapped with `t()` from `useTranslation()`. No raw string literals allowed in rendered output.

**Applies to:** Button labels, placeholder text, tooltip labels, error messages, section headings, dropdown options, notification messages — everything the user sees.

**Exceptions:** Keyboard shortcut hints like `alt+s`, date format tokens like `DD-MM-YYYY`, and CSS/prop values are NOT translated.

**When adding new text:**
1. Wrap it with `t("KeyName")` in JSX
2. Add `"KeyName": "English text"` to `src/lang/en/translation.json`
3. Add `"KeyName": "বাংলা টেক্সট"` to `src/lang/bn/translation.json`

**Key naming convention:** PascalCase, descriptive, no spaces (e.g. `GrandTotal`, `TransactionModeRequired`, `ClickHereForChangeMode`).

**For files that don't yet import useTranslation:**
```js
import { useTranslation } from "react-i18next";
// inside component:
const { t } = useTranslation();
```

**For Select dropdown options that need translation but must keep a stable stored value:**
```jsx
data={[
  { value: 'Refund', label: t("Refund") },
  { value: 'Exchange', label: t("Exchange") },
]}
```
