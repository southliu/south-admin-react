# AGENTS.md

中后台管理前端项目：React 19 + TypeScript + Vite 8 + Ant Design 6 + Zustand，pnpm monorepo。详细说明可参考 `CLAUDE.md` 与 `README.md`。

## 常用命令

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 生产构建（tsc + vite build）
pnpm lint             # ESLint 检查并自动修复
pnpm lint:stylelint   # 样式检查
pnpm prettier         # 格式化代码
pnpm test             # Node 原生回归测试
pnpm test:e2e         # Playwright 浏览器回归测试
```

- 安装依赖必须加 `-w`（monorepo 根）：`pnpm i <package> -w`；pnpm 10+ 构建脚本被拦截时执行 `pnpm approve-builds`。
- 回归测试使用 Node 原生 test runner 与 Playwright；按变更范围运行 `pnpm test` / `pnpm test:e2e`，并执行 `pnpm lint` + `pnpm dev` / `pnpm build`。
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
- **输入框必须限制长度**：开发输入框前先确认对应数据库表字段的长度（查后端表结构/API 文档，不清楚时向用户确认），并在表单/搜索 schema 的 `componentProps.maxLength` 中设置该长度（如 `varchar(50)` → `maxLength: 50`，参考 `src/pages/system/user/model.tsx`）；不允许出现没有 `maxLength` 的文本输入框。
- **能组件化就组件化**：
  - 仅当前页面使用的组件 → 放在该页面子文件夹的 `components/` 中（参考 `src/pages/system/menu/components/`）。
  - 全局/跨页面使用的组件 → 放 `src/components/`，公共二次封装组件以 `Base` 开头（如 `BaseTable`、`BaseForm`、`BaseModal`）。
- **接口文件放 `src/servers/`，目录结构必须与 `src/pages/` 保持一致**：如 `src/pages/system/user/` 对应 `src/servers/system/user.ts`。
- **接口方法直接返回请求**：保持 `export function xxx() { return request.get/post/put(...); }` 格式。认证与通用错误处理放请求层，加载重试放调用方共享逻辑，不在 API 文件里增加循环、业务校验或重试。
- 接口错误优先显示后端有效的 `message/detail`；没有错误信息时，统一使用国际化键 `public.networkError`（中文：网络异常，请稍后重试），不自行生成或覆盖后端业务错误。
- 样式尽量使用 UnoCSS 原子类，避免写冗余 less。

## 目录结构

- `src/pages/` — 页面（路由按目录结构自动生成，见下）
- `src/servers/` — API 接口，结构与 pages 一致
- `src/components/` — 全局公共组件（Base 前缀）
- `src/stores/` — Zustand 状态（user/menu/tabs/public）
- `src/hooks/useCommonStore.ts` — 聚合各 store（`useShallow` 优化），组件中优先使用 `useCommonStore(['permissions', 'isPhone'])` 按需订阅字段，避免订阅无关状态
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
- TypeScript 严格模式，Hooks、组件、工具函数与类型均使用显式导入，类型使用 `import type`。
- 导入按 `import type`、具名 `import {}`、默认 `import xxx` 分组，同组按整条导入语句长度降序排列，等长保留原序；不调整花括号内成员顺序。`pnpm lint` 自动修复。副作用导入和导入间的注释作为边界，保留初始化顺序与注释归属。
- 函数注释统一使用 JSDoc：只有一行内容时写成 `/** 中文说明 */`，包含参数说明等多行内容时使用 `/**` 开头、`*/` 结尾的多行格式；用中文说明函数用途；每个形参必须按声明顺序使用 `@param 参数名 - 中文说明` 描述用途、约束或保留原因。参数名必须与当前签名一致；对象参数先说明整体用途，补充字段说明时使用 `参数名.字段名`；解构参数逐项说明，无参数函数不写空 `@param`。已有函数注释与 CRUD 模板、代码片段均遵循此格式。
- Hook 变量声明优先按 `const { ... }`（对象解构）、`const [ ... ]`（数组解构）、`const xxx`（普通变量）的顺序排列；各类内部按业务语义分组，不按文字长度排序。保留初始化依赖顺序，不为排序将变量移到其依赖声明之前。
- `useState` 声明中，布尔状态放在其他状态之前，状态变量必须以 `is` 开头（如 `isFetch`、`isLoading`、`isCreateOpen`、`isCreateLoading`）；同一业务的状态按语义排列，如弹窗开关在弹窗加载状态之前，其后依次为标题、ID、表单数据。setter 保留 `setFetch`、`setLoading` 等命名，无需加 `is`。新建 CRUD 页面也必须遵循此约定。

## 其他工具

- `pnpm init:project` — 一键清除模板演示内容（demo 页面、content 模块等），不可逆，见 `.claude/skills/init-project/SKILL.md`
- `.vscode/south.code-snippets` — `demoPage`/`demoModel`/`demoApi` 等代码片段，是 demo-create skill 的模板来源

## 工作规则（必须遵守）

1. 不允许跳过项目上下文直接改代码；先读相关模块再动手。
2. 不允许没有验证就声称完成；改动必须 `pnpm lint` 通过并实际运行验证后才能报告完成。
3. 不允许为了完成局部需求大范围重构无关模块。
4. 不允许恢复或覆盖用户已有的未说明改动（改动前先 `git status`/`git diff` 确认工作区）。
5. 不允许引入与当前项目技术栈和代码风格冲突的实现方式。
6. 函数说明遵循上述 JSDoc 格式与参数说明规范；函数体内的实现注释只写 non-obvious reason，禁止保留 intermediate attempts；PR/提交描述只写最终行为，diff 里看不出来的取舍与从未合入的状态一律不提。
7. 验证用的临时数据和前后端 dev 端口在收尾时必须清理/关闭；临时改动（如 `.env.development` 代理切换）必须还原。
