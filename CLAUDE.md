# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm dev              # Start dev server (Vite with host flag)
pnpm build            # Production build (TypeScript + Vite)
pnpm build:dev        # Development build
pnpm build:test       # Test environment build
```

### Code Quality
```bash
pnpm lint             # ESLint with auto-fix
pnpm lint:stylelint   # Stylelint for CSS/Less
pnpm prettier         # Format code with Prettier
```

### Package Management
```bash
pnpm install -w       # Install dependencies (use -w for monorepo root)
pnpm i <package> -w   # Install new dependencies at workspace root
```

### Git
```bash
npx husky install     # Reinstall husky hooks if commit fails
```

## Project Architecture

This is a monorepo-based React admin application using pnpm workspaces, built with Vite, TypeScript, React 19, Ant Design, and Zustand.

### Monorepo Structure
- **Root**: Main application in `src/`
- **packages/**: Shared workspace packages
  - `@south/request`: HTTP request wrapper
  - `@south/message`: Global messaging component
  - `@south/utils`: Shared utilities
  - `@south/stylelint`: Stylelint configuration

When installing new dependencies, use `pnpm i <package> -w` to install at the workspace root.

### Automatic Route Generation
Routes are automatically generated from the `src/pages/` directory structure using `vite glob`:

```typescript
// src/router/utils/config.ts
export const ROUTER_EXCLUDE = [
  'login', 'forget', 'components', 'utils', 'lib', 'hooks',
  'model.tsx', '404.tsx'
];
```

**Route rules:**
- File path `src/pages/dashboard/index.tsx` → route `/dashboard`
- File path `src/pages/dashboard/index.tsx` → route `/`
- Dynamic routes use `[param]` syntax: `src/pages/user/[id].tsx` → route `/user/:id`
- All `index.tsx` files have `/index` removed from the route path

Route configuration is in `src/router/components/Router.tsx` using `handleRoutes()` helper.

### State Management (Zustand)
Stores are in `src/stores/`:
- `useUserStore`: User info, permissions, authentication
- `useMenuStore`: Menu state, collapse state, open keys
- `useTabsStore`: Tab navigation, active tabs
- `usePublicStore`: Global app state (theme, fullscreen, refresh)

**Important**: Use `useCommonStore()` hook from `src/hooks/useCommonStore.ts` which combines all stores with `useShallow` for optimized re-renders:

```typescript
const { permissions, theme, menuList, tabs } = useCommonStore();
```

### Permission System
Two-level permission system:

1. **Page-level permissions** (from `/user/login` or `/user/refresh-permissions`):
   - Stored in `useUserStore` as `permissions` array
   - Controls if user can access a page

2. **Menu-level permissions** (from `/menu/list`):
   - `rule` field in menu data controls menu visibility
   - If no `rule` is returned, menu always shows

**Usage in pages:**
```typescript
const pagePermission: PagePermission = {
  page: checkPermission('/xxx', permissions),
  create: checkPermission('/xxx/create', permissions),
  update: checkPermission('/xxx/update', permissions),
  delete: checkPermission('/xxx/delete', permissions),
};
```

See `src/pages/system/menu/index.tsx` for reference.

### Menu Configuration
Two menu modes available (configured in `src/hooks/useCommonStore.ts`):

1. **Dynamic menu** (default): From `/menu/list` API
2. **Static menu**: Set `menuList = defaultMenus` using `import { defaultMenus } from '@/menus'`

### Component Architecture
All common components are in `src/components/`:

**Naming convention**: Public/secondary wrappers use `Base` prefix (e.g., `BaseTable`, `BaseForm`, `BaseModal`).

**Key components:**
- `BaseTable`: Enhanced table with virtual scrolling, column filtering, resizable columns, zebra striping
- `BaseForm`: Form builder with component mapping
- `BaseModal`: Modal wrapper with loading states
- `BaseCard`, `BaseContent`: Layout containers

### Form Component System
Forms use a declarative `BaseFormList` schema:

```typescript
const createList: BaseFormList[] = [
  {
    label: 'Name',
    name: 'name',
    rules: FORM_REQUIRED,
    component: 'Input',  // Mapped in components/Form/utils/componentMap.tsx
  }
];
```

Supported components are mapped in `src/components/Form/utils/componentMap.tsx`.

### API Structure
APIs are in `src/servers/` organized by feature:

```typescript
import { request } from '@/utils/request';

enum API {
  URL = '/xxx',
}

export function getXXXPage(data: PaginationData) {
  return request.get<PageServerResult<T>>(`${API.URL}/page`, { params: data });
}
```

### Build Configuration
- Vite plugins in `build/plugins/index.ts`
- React SWC for fast compilation
- UnoCSS for atomic CSS
- Legacy plugin for browser compatibility (production only)
- Auto-import plugin configured in `build/plugins/autoImport.ts`

### Code Snippets
VS Code snippets are in `.vscode/south.code-snippets`:
- `demoPage`: Complete page with table, pagination, CRUD
- `demoModel`: Model file with search/form/table columns
- `demoApi`: API file with CRUD functions
- `demoOptionPage`: Single-page edit/create form
- `loadHook`, `fetchhook`, `pagehook`, `apiFn`: Utility snippets

### KeepAlive
The app uses `keepalive-for-react` for tab caching. Key hooks:
- `useEffectOnActive()`: Trigger when tab becomes active
- `useSingleTab()`: Configure single-page tabs

### Internationalization
Uses `react-i18next` with `i18next-browser-languagedetector` and `i18next-http-backend`.
Translations in `src/locales/{zh,en}/` by feature.

## Important Patterns

### Creating a New Page
1. Create folder in `src/pages/` (e.g., `src/pages/log/`)
2. Create `model.ts` - enter `demoModel` snippet
3. Create API in `src/servers/log.ts` - enter `demoApi` snippet
4. Create `index.tsx` - enter `demoPage` snippet

### Component Re-rendering
The project uses `useShallow` from Zustand to prevent unnecessary re-renders. Always prefer `useCommonStore()` over direct store access in components.

### Virtual Scrolling Tables
Enable with `isVirtual` prop on `BaseTable`. Automatically calculates height and uses react-window for performance.

### Icon System
Uses Iconify with `@iconify/react`. Browse icons at https://icon-sets.iconify.design/
Install "Iconify IntelliSense" extension for inline preview and autocomplete.

### Git Commit Convention
Commits must follow conventional format enforced by husky:
- `feat`: New feature
- `fix`: Bug fix
- `perf`: Performance optimization
- `refactor`: Code refactoring
- `style`: Code style
- `docs`: Documentation
- `chore`: Dependency/config changes
- `test`: Tests
- `types`: TypeScript types

Example: `git commit -m "feat: add user management"`

If commits fail, run `npx husky install` and retry.

### TypeScript Configuration
- `@/*` → `src/*`
- `#/*` → `types/*`
- Strict mode enabled with unused locals/variables checking
