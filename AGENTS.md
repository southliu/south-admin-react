# AGENTS.md

中后台管理前端项目：React 19 + TypeScript + Vite 7 + Ant Design 6 + Zustand，pnpm monorepo。详细说明可参考 `CLAUDE.md` 与 `README.md`。

## 常用命令

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 生产构建（tsc + vite build）
pnpm lint             # ESLint 检查并自动修复
pnpm lint:stylelint   # 样式检查
pnpm prettier         # 格式化代码
```

- 安装依赖必须加 `-w`（monorepo 根）：`pnpm i <package> -w`；pnpm 10+ 构建脚本被拦截时执行 `pnpm approve-builds`。
- 无测试框架，验证方式为 `pnpm lint` + `pnpm dev` / `pnpm build`。
- Git 提交遵循 conventional commits（husky + commitlint 强制，如 `feat: xxx`）；提交失败先执行 `npx husky install`。

## 新建页面（重要约定）

- **pages 目录按菜单结构命名**：一级菜单 → 父文件夹，二级菜单 → 子文件夹（kebab-case）。如菜单为「系统管理-菜单管理、系统管理-用户管理、商城管理-商品类型、商城管理-商品列表」，对应：

  ```
  src/pages/system/menu/index.tsx      # 系统管理-菜单管理
  src/pages/system/user/index.tsx      # 系统管理-用户管理
  src/pages/mall/goods-type/index.tsx  # 商城管理-商品类型
  src/pages/mall/goods/index.tsx       # 商城管理-商品列表
  ```

  即 `src/pages/<一级菜单>/<二级菜单>/index.tsx`；同菜单层级的页面必须落在同一父文件夹下，路由 `/system/menu` 由目录自动生成。
- **优先使用 `/demo-create` skill**（`.claude/skills/demo-create/SKILL.md`）生成标准 CRUD 页面，不要手写整套模板。
- **【强制】每次创建新的路由页面，必须使用 `/demo-create` skill 生成**（`.claude/skills/demo-create/SKILL.md`），不要手写整套 CRUD 模板。仅以下情况可以不用 demo-create：页面非标准 CRUD 结构（如仪表盘、自定义复杂布局），此时在 AGENTS.md 或对话中说明原因。
- 每页固定 `index.tsx + model.ts`（model 承放搜索项、表格列、表单配置），文件夹划分要清晰分明。
- **能组件化就组件化**：
  - 仅当前页面使用的组件 → 放在该页面子文件夹的 `components/` 中（参考 `src/pages/system/menu/components/`）。
  - 全局/跨页面使用的组件 → 放 `src/components/`，公共二次封装组件以 `Base` 开头（如 `BaseTable`、`BaseForm`、`BaseModal`）。
- **接口文件放 `src/servers/`，目录结构必须与 `src/pages/` 保持一致**：如 `src/pages/system/user/` 对应 `src/servers/system/user.ts`。
- 样式尽量使用 UnoCSS 原子类，避免写冗余 less。

## 目录结构

- `src/pages/` — 页面（路由按目录结构自动生成，见下）
- `src/servers/` — API 接口，结构与 pages 一致
- `src/components/` — 全局公共组件（Base 前缀）
- `src/stores/` — Zustand 状态（user/menu/tabs/public）
- `src/hooks/useCommonStore.ts` — 聚合各 store（`useShallow` 优化），组件中优先用它而非直接访问 store
- `src/locales/{zh,en}/` — i18n 翻译（react-i18next）
- `packages/` — monorepo 子包：`@south/request`、`@south/message`、`@south/utils`、`@south/stylelint`

## 路由（自动生成）

由 `src/pages/` 目录经 vite glob 自动生成，无需手动注册：

- `src/pages/system/user/index.tsx` → `/system/user`
- 动态路由用 `[param]` 语法：`src/pages/user/[id].tsx` → `/user/:id`
- 路径包含 `login`、`forget`、`components`、`utils`、`lib`、`hooks`、`model.tsx`、`404.tsx` 时不生成路由（配置在 `src/router/utils/config.ts`）

## 权限

页面内通过 `checkPermission` 构建 `PagePermission`（page/create/update/delete），参考 `src/pages/system/menu/index.tsx`。菜单支持动态（`/menu/list` 接口）与静态（`src/menus/`）两种模式。

## 路径别名与规范

- `@/*` → `src/*`，`#/*` → `types/*`
- 表单用声明式 `BaseFormList` schema，组件映射在 `src/components/Form/utils/componentMap.tsx`
- 图标用 Iconify（`@iconify/react`）
- TypeScript 严格模式，`pnpm build` 前需存在 `types/autoImports.d.ts`（不存在则先跑一次 `pnpm dev` 生成）

## 其他工具

- `pnpm init:project` — 一键清除模板演示内容（demo 页面、content 模块等），不可逆，见 `.claude/skills/init-project/SKILL.md`
- `.vscode/south.code-snippets` — `demoPage`/`demoModel`/`demoApi` 等代码片段，是 demo-create skill 的模板来源
