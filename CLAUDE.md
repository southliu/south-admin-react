# CLAUDE.md

本文件为 Claude Code 在此仓库中开发提供指引，通用开发约定与 `AGENTS.md` 保持一致。项目介绍与使用说明见 `README.md`。

## 常用命令

### 开发与验证

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 生产构建（TypeScript + Vite）
pnpm build:dev        # 开发环境构建
pnpm build:test       # 测试环境构建
pnpm test             # Node 原生回归测试
pnpm test:e2e         # Playwright 浏览器回归测试
```

### 代码检查

```bash
pnpm lint             # ESLint 检查并自动修复
pnpm lint:stylelint   # 样式检查
pnpm prettier         # 格式化代码
```

按变更范围运行 `pnpm test` / `pnpm test:e2e`，并执行 `pnpm lint` + `pnpm dev` / `pnpm build`。

### 依赖管理

安装依赖必须加 `-w`，安装到 monorepo 根目录：

```bash
pnpm install -w
pnpm i <package> -w
```

pnpm 10+ 拦截依赖构建脚本时，执行 `pnpm approve-builds`。

### Git 提交

提交遵循 conventional commits，husky 与 commitlint 会强制检查。提交失败时先执行 `npx husky install`。

常用提交类型：

- `feat`：新增功能
- `fix`：修复问题
- `perf`：性能优化
- `refactor`：代码重构
- `style`：代码格式调整
- `docs`：文档或注释
- `chore`：依赖、配置或维护工作
- `test`：测试
- `types`：类型定义

示例：`git commit -m "feat: 新增用户管理"`。

## 项目架构

中后台管理前端项目，使用 React 19、TypeScript、Vite 8、Ant Design 6 与 Zustand，采用 pnpm monorepo。

### 目录结构

- `src/pages/`：页面，按菜单层级划分目录，并自动生成路由。
- `src/servers/`：接口文件，目录结构与 `src/pages/` 保持一致。
- `src/components/`：全局公共组件，公共二次封装组件使用 `Base` 前缀。
- `src/stores/`：Zustand 状态。
- `src/hooks/`：公共 Hook。
- `src/locales/{zh,en}/`：按业务模块组织的中英文翻译。
- `build/`：Vite 插件、代理与构建配置。
- `packages/`：共享子包，包括 `@south/request`、`@south/message`、`@south/utils` 与 `@south/stylelint`。

### 路径别名与类型

- `@/*` → `src/*`
- `#/*` → `types/*`
- TypeScript 使用严格模式，并检查未使用的局部变量与参数。
- Hook、组件、工具函数与类型均使用显式导入，类型使用 `import type`。

## 新建页面

**每次创建新的路由页面，必须使用 `/demo-create` 技能**（`.claude/skills/demo-create/SKILL.md`），不要手写整套 CRUD 模板。只有仪表盘、自定义复杂布局等非标准 CRUD 页面可以例外，此时须在 `AGENTS.md` 或对话中说明原因。

页面目录按菜单结构使用 kebab-case 命名：一级菜单对应父文件夹，二级菜单对应子文件夹。

```text
src/pages/system/menu/index.tsx      # 系统管理－菜单管理
src/pages/system/user/index.tsx      # 系统管理－用户管理
src/pages/mall/goods-type/index.tsx  # 商城管理－商品类型
src/pages/mall/goods/index.tsx       # 商城管理－商品列表
```

同一菜单层级的页面必须放在同一父文件夹下。每页固定使用 `index.tsx + model.ts`，搜索项、表格列与表单配置放在 model 中。

接口文件与页面目录对应，例如 `src/pages/system/user/` 对应 `src/servers/system/user.ts`。

仅当前页面使用的组件放在页面目录下的 `components/`，跨页面组件放在 `src/components/`。

## 路由自动生成

通过 `vite glob` 扫描 `src/pages/`，无需手动注册路由：

- `src/pages/system/user/index.tsx` → `/system/user`
- `src/pages/dashboard/index.tsx` → `/dashboard`
- `src/pages/index.tsx` → `/`
- `src/pages/user/[id].tsx` → `/user/:id`

路由生成时会去掉文件扩展名与路径中的 `/index`。动态参数使用 `[param]` 语法。

排除规则位于 `src/router/utils/config.ts`，路径包含以下内容时不生成路由：

```typescript
export const ROUTER_EXCLUDE = [
  'login',
  'forget',
  'components',
  'utils',
  'lib',
  'hooks',
  'model.tsx',
  '404.tsx',
];
```

路由入口为 `src/router/components/Router.tsx`，通过 `handleRoutes()` 处理页面文件。

## 状态管理

Zustand 状态位于 `src/stores/`：

- `useUserStore`：用户信息、权限与认证状态。
- `useMenuStore`：菜单列表、折叠状态与展开项。
- `useTabsStore`：标签导航与当前激活标签。
- `usePublicStore`：主题、全屏、刷新等公共状态。

组件中优先通过 `src/hooks/useCommonStore.ts` 聚合并按需订阅字段。该 Hook 使用 `useShallow` 优化订阅，避免无关状态变化触发重渲染：

```typescript
const { permissions, isPhone } = useCommonStore(['permissions', 'isPhone']);
```

## 权限与菜单

### 页面与操作权限

登录或刷新权限接口返回的权限保存在 `useUserStore.permissions`。页面内使用 `checkPermission` 构建 `PagePermission`：

```typescript
const pagePermission: PagePermission = {
  page: checkPermission('/xxx', permissions),
  create: checkPermission('/xxx/create', permissions),
  update: checkPermission('/xxx/update', permissions),
  delete: checkPermission('/xxx/delete', permissions),
};
```

参考 `src/pages/system/menu/index.tsx`。

### 菜单配置

支持动态与静态两种菜单模式：

- 动态菜单通过 `/menu/list` 接口获取。
- 静态菜单定义在 `src/menus/`，入口导出 `defaultMenus`。

菜单的 `rule` 字段用于判断是否可见；没有 `rule` 的菜单不受该字段限制。菜单恢复流程由 `src/menus/utils/load.ts` 在登录与布局之间共享。

## 公共组件与表单

公共二次封装组件使用 `Base` 前缀，例如 `BaseTable`、`BaseForm` 与 `BaseModal`。

常用组件：

- `BaseTable`：支持虚拟滚动、列筛选、列宽拖拽与斑马纹。
- `BaseForm`：根据声明式配置构建表单。
- `BaseModal`：带加载状态的对话框。
- `BaseCard`、`BaseContent`：页面布局容器。

### 表单配置与输入长度

表单使用声明式 `BaseFormList` schema，组件映射位于 `src/components/Form/utils/componentMap.tsx`。

开发文本输入框前，必须先确认对应数据库字段长度，并在表单或搜索 schema 的 `componentProps.maxLength` 中设置限制。不清楚字段长度时，查询后端表结构、API 文档或向用户确认；不允许出现没有 `maxLength` 的文本输入框。

已确认的用户字段长度定义在 `src/utils/fieldLimits.ts`，可按现有字段配置使用：

```typescript
import type { BaseFormList } from '#/form';
import { USER_LENGTH } from '@/utils/fieldLimits';
import { FORM_REQUIRED } from '@/utils/config';

const createList: BaseFormList[] = [
  {
    label: '姓名',
    name: 'name',
    rules: FORM_REQUIRED,
    component: 'Input',
    componentProps: { maxLength: USER_LENGTH.name },
  },
];
```

## 接口与错误处理

接口放在 `src/servers/`，按页面目录组织，方法直接返回请求：

```typescript
import type { PaginationData } from '#/public';
import { request } from '@/utils/request';

/**
 * 获取分页数据
 * @param data - 分页查询参数
 */
export function getXXXPage(data: PaginationData) {
  return request.get('/xxx/page', { params: data });
}
```

认证与通用错误处理放在请求层，加载重试放在调用方的共享逻辑中。不要在 API 文件里增加循环、业务校验或重试。

接口错误优先展示后端有效的 `message/detail`；没有错误信息时，统一使用国际化键 `public.networkError`，中文为“网络异常，请稍后重试”，不自行生成或覆盖后端业务错误。

## 代码规范

- 导入按 `import type`、具名 `import {}`、默认 `import xxx` 分组，同组按整条导入语句长度降序排列，等长保留原序。不调整花括号内成员顺序。副作用导入与导入间注释作为边界，保留初始化顺序与注释归属。`pnpm lint` 会自动修复。
- 函数注释使用 JSDoc：只有一行内容时写成 `/** 中文说明 */`，包含参数说明等多行内容时使用多行格式。用中文说明函数用途，每个形参按声明顺序使用 `@param 参数名 - 中文说明` 描述用途、约束或保留原因。参数名与当前签名一致；对象参数先说明整体用途，字段说明使用 `参数名.字段名`；解构参数逐项说明，无参数函数不写空 `@param`。现有代码、CRUD 模板与代码片段均遵循此格式。
- Hook 变量声明优先按对象解构（`const { ... }`）、数组解构（`const [ ... ]`）、普通变量（`const xxx`）排列。同类内部按业务语义分组，不按文字长度排序，并保留初始化依赖顺序。
- 布尔 `useState` 放在其他状态之前，状态变量以 `is` 开头，例如 `isFetch`、`isLoading`、`isCreateOpen`、`isCreateLoading`。同一业务按弹窗开关、弹窗加载状态、标题、ID、表单数据的顺序排列。setter 保留 `setFetch`、`setLoading` 等命名，无需加 `is`。生成的 CRUD 页面也遵循此约定。
- 样式优先使用 UnoCSS 原子类，避免冗余 less。

## 构建、缓存与国际化

### 构建配置

- Vite 插件位于 `build/plugins/index.ts`。
- Vite 8 使用 Rolldown + Oxc，React 插件为 `@vitejs/plugin-react`。
- 面向现代浏览器，使用 Vite 的 Baseline Widely Available 默认目标，不生成 legacy 构建产物。

### 页面缓存

使用 `keepalive-for-react` 缓存标签页：

- `useEffectOnActive()`：页面激活时执行逻辑。
- `useSingleTab()`：配置独立操作页面的标签与导航。

### 虚拟滚动表格

在 `BaseTable` 上开启 `isVirtual` 可使用虚拟滚动；需要自动计算表格高度时使用 `isAuthHeight`。

### 国际化与图标

国际化使用 `react-i18next` 与 `i18next-browser-languagedetector`，翻译位于 `src/locales/{zh,en}/`，按业务模块组织。

图标使用 Iconify（`@iconify/react`）。可在 [Iconify 图标库](https://icon-sets.iconify.design/) 查找图标，安装编辑器扩展 `Iconify IntelliSense` 获取预览和补全。

## 代码片段与清理工具

`.vscode/south.code-snippets` 是 `/demo-create` 的模板来源，包含：

- `demoPage`：分页表格与 CRUD 页面。
- `demoModel`：搜索项、表单配置与表格列。
- `demoApi`：CRUD 接口。
- `demoOptionPage`：独立新增或编辑页面。
- `loadHook`、`fetchhook`、`pagehook`、`apiFn`：常用工具片段。

`pnpm init:project` 会清除模板演示内容，操作不可逆，执行前须阅读 `.claude/skills/init-project/SKILL.md`。

## 工作规则

1. 修改代码前先读取相关模块，不跳过项目上下文。
2. 未验证不得声称完成；改动须通过 `pnpm lint` 并实际运行验证。
3. 不为局部需求大范围重构无关模块。
4. 改动前检查 `git status` / `git diff`，不恢复或覆盖用户已有的未说明改动。
5. 实现方式须与项目技术栈和代码风格一致。
6. 函数说明遵循上述 JSDoc 格式与参数规范；函数体内只注释不明显的原因，不保留中间尝试。PR 和提交描述只写最终行为，不提 diff 中看不出的取舍或从未合入的状态。
7. 收尾时清理验证用临时数据，关闭临时前后端开发端口，并还原代理切换等临时配置。
