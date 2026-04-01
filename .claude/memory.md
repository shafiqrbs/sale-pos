# Project Memory

## Feedback

### Always use useDisclosure for modals
Never use `useState(boolean)` for modal/drawer state — always use `useDisclosure` from `@mantine/hooks`.

**Why:** User explicitly corrected this — it's a project convention enforced across the codebase.

**How to apply:** Any time you need to control modal/drawer visibility, use:
```js
const [opened, { open, close }] = useDisclosure(false);
```
