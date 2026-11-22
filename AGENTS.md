# AGENTS.md

中后台管理前端项目：React 19 + TypeScript + Vite 8 + Ant Design 6 + Zustand，pnpm monorepo。

本文件统一维护仓库的开发规则。[CLAUDE.md](./CLAUDE.md) 补充架构与实现入口，[README.md](./README.md) 提供项目介绍和使用说明。修改共同规则时只更新本文件，避免多处维护。

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

开发和测试环境构建使用 `pnpm build:dev` / `pnpm build:test`；其他脚本见 [package.json](./package.json)。

- 安装依赖必须加 `-w`（monorepo 根）：`pnpm i <package> -w`。pnpm 10+ 拦截构建脚本时执行 `pnpm approve-builds`。
- Git 提交遵循 conventional commits（husky + commitlint 强制），如 `feat: 新增用户管理`。常用类型为 `feat`、`fix`、`perf`、`refactor`、`style`、`docs`、`chore`、`test`、`types`；提交失败先执行 `npx husky install`。

## 新建页面

- **每次创建新的路由页面，必须使用 `/demo-create` 技能**（[SKILL.md](./.claude/skills/demo-create/SKILL.md)），不要手写整套 CRUD 模板。仪表盘、自定义复杂布局等非标准 CRUD 页面可以例外，但须在本文件或对话中说明原因。
- 页面按菜单层级使用 kebab-case 命名：`src/pages/<一级菜单>/<二级菜单>/index.tsx`，同层页面放在同一父文件夹下。目录示例见 [CLAUDE.md](./CLAUDE.md#目录概览)。
- 每页固定 `index.tsx + model.ts`，model 承放搜索项、表格列与表单配置。
- 路由由页面目录自动生成，无需手动注册；动态参数与排除规则见 [路由与页面加载](./CLAUDE.md#路由与页面加载)。
- 接口文件放在 `src/servers/`，目录结构与页面保持一致，例如 `src/pages/system/user/` 对应 `src/servers/system/user.ts`。
- 仅当前页面使用的组件放在页面子目录 `components/`；跨页面组件放在 `src/components/`。公共二次封装组件以 `Base` 开头，如 `BaseTable`、`BaseForm`、`BaseModal`。

## 表单与接口

- 表单使用声明式 `BaseFormList` schema，组件映射在 `src/components/Form/utils/componentMap.tsx`。
- **文本输入框必须设置长度限制**：开发前先查后端表结构或 API 文档，确认数据库字段长度；不清楚时向用户确认。在表单或搜索 schema 的 `componentProps.maxLength` 中设置对应长度，如 `varchar(50)` → `maxLength: 50`。参考 `src/pages/system/user/model.tsx`，不允许出现没有 `maxLength` 的文本输入框。
- 接口方法直接返回请求，保持 `export function xxx() { return request.get/post/put(...); }` 格式。认证与通用错误处理放在请求层，加载重试放在调用方共享逻辑中，不在 API 文件中增加循环、业务校验或重试。
- 接口错误优先显示后端有效的 `message/detail`；没有错误信息时统一使用国际化键 `public.networkError`（中文：网络异常，请稍后重试），不自行生成或覆盖后端业务错误。

## 状态与权限

- 组件中优先使用 `src/hooks/useCommonStore.ts` 聚合状态，并通过 `useCommonStore(['permissions', 'isPhone'])` 按需订阅字段。该 Hook 使用 `useShallow` 优化，避免订阅无关状态。
- 页面内通过 `checkPermission` 构建 `PagePermission`（page/create/update/delete），参考 `src/pages/system/menu/index.tsx`。

## 代码规范

### 页面内容与沟通边界

- 页面只呈现终端用户完成业务所需的内容。给 agent 的指令、设计要求、实现约束和反馈用于指导开发；未经明确展示要求，不得写入 HTML、JSX、国际化文案，也不得通过 HTML 注释、隐藏节点或属性带入页面。
- 实现说明、调试过程、修改原因和完成情况留在对话回复中。检查界面时核对文案与 DOM，确保没有混入沟通内容。

### 类型与样式

- 路径别名：`@/*` → `src/*`，`#/*` → `types/*`。
- TypeScript 使用严格模式；Hook、组件、工具函数与类型均使用显式导入，类型使用 `import type`。
- 图标使用 Iconify（`@iconify/react`）。样式尽量使用 UnoCSS 原子类，避免冗余 less。

### 导入

- 按 `import type`、具名 `import {}`、默认 `import xxx` 分组。
- 同组按整条导入语句长度降序排列，等长保留原序，不调整花括号内成员顺序。`pnpm lint` 会自动修复。
- 副作用导入和导入间的注释作为边界，保留初始化顺序与注释归属。

### 函数注释

- 使用 JSDoc，用中文说明函数用途。只有一行内容时写成 `/** 中文说明 */`；包含参数说明等多行内容时使用多行格式。
- 每个形参按声明顺序使用 `@param 参数名 - 中文说明`，说明用途、约束或保留原因，参数名与当前签名保持一致。
- 对象参数先说明整体用途，补充字段说明时使用 `参数名.字段名`；解构参数逐项说明，无参数函数不写空 `@param`。
- 现有函数注释、CRUD 模板与代码片段均遵循此格式。函数体内只注释不明显的原因，不保留中间尝试。

### Hook 与状态声明

- 变量声明优先按对象解构（`const { ... }`）、数组解构（`const [ ... ]`）、普通变量（`const xxx`）排列。同类内部按业务语义分组，不按文字长度排序。
- 保留初始化依赖顺序，不为排序将变量移到其依赖声明之前。
- 布尔 `useState` 放在其他状态之前，状态变量以 `is` 开头，如 `isFetch`、`isLoading`、`isCreateOpen`、`isCreateLoading`。setter 保留 `setFetch`、`setLoading` 等命名，无需加 `is`。
- 同一业务的状态依次排列为弹窗开关、弹窗加载状态、标题、ID、表单数据。生成的 CRUD 页面也须遵循上述约定。

## 验证要求

按实际改动选择验证范围，未验证不得声称完成：

| 改动类型 | 必须执行的验证 |
| --- | --- |
| 仅文档或说明性注释 | 检查格式、引用路径及规范一致性，执行 `git diff --check`；文档中的命令、示例与当前实现核对 |
| 业务代码、构建配置或影响工具行为的注释 | 执行 `pnpm lint`，并通过 `pnpm dev` 实际运行或执行 `pnpm build`；按变更范围运行 `pnpm test` / `pnpm test:e2e` |
| 样式或界面 | 在代码验证基础上运行样式检查，并实际查看相关界面与交互 |

涉及 `@ts-*`、ESLint 指令等工具注释时，不按纯说明性注释处理。测试应验证行为，不为低影响改动新增仅复述实现的测试。

## 其他工具

- `.vscode/south.code-snippets`：`demoPage`、`demoModel`、`demoApi`、`demoOptionPage` 等代码片段，也是 `/demo-create` 的模板来源。
- `pnpm init:project`：清除模板演示内容，操作不可逆，执行前阅读 [SKILL.md](./.claude/skills/init-project/SKILL.md)。

## 工作规则

1. 修改前先读取相关模块，并检查 `git status` / `git diff`，不恢复或覆盖用户已有的未说明改动。
2. 实现方式须符合项目技术栈与代码风格，不为局部需求大范围重构无关模块。
3. 按上述验证要求检查改动，如实说明结果与未验证的部分。
4. PR 和提交描述只写最终行为，不提 diff 中看不出的取舍或从未合入的状态。
5. 收尾时清理验证用临时数据，关闭临时前后端开发端口，并还原代理切换等临时配置。
