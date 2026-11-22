# CLAUDE.md

开始任务前阅读并遵守 [AGENTS.md](./AGENTS.md)。共同开发规则只在该文件维护；本文件补充架构与实现入口，项目介绍和启动说明见 [README.md](./README.md)。

## 规则索引

| 工作内容 | 规范位置 |
| --- | --- |
| 开发命令、依赖与提交 | [常用命令](./AGENTS.md#常用命令) |
| 创建页面、组织接口与组件 | [新建页面](./AGENTS.md#新建页面) |
| 表单配置、输入长度与错误处理 | [表单与接口](./AGENTS.md#表单与接口) |
| 区分页面文案与给 agent 的指令 | [页面内容与沟通边界](./AGENTS.md#页面内容与沟通边界) |
| 导入、注释与状态声明 | [代码规范](./AGENTS.md#代码规范) |
| 检查与回归测试 | [验证要求](./AGENTS.md#验证要求) |

## 目录概览

| 目录 | 内容 |
| --- | --- |
| `src/pages/`、`src/servers/` | 页面与对应接口 |
| `src/components/` | 全局公共组件 |
| `src/stores/` | Zustand 状态 |
| `src/locales/{zh,en}/` | react-i18next 中英文翻译 |
| `packages/` | 共享子包 `@south/request`、`@south/message`、`@south/utils`、`@south/stylelint` |

页面目录示例：

```text
src/pages/system/menu/index.tsx      # 系统管理－菜单管理
src/pages/system/user/index.tsx      # 系统管理－用户管理
src/pages/mall/goods-type/index.tsx  # 商城管理－商品类型
src/pages/mall/goods/index.tsx       # 商城管理－商品列表
```

## 路由与页面加载

通过 `vite glob` 扫描页面目录：`src/pages/system/user/index.tsx` → `/system/user`，动态参数 `src/pages/user/[id].tsx` → `/user/:id`。路径包含 `login`、`forget`、`components`、`utils`、`lib`、`hooks`、`model.tsx`、`404.tsx` 时不生成路由。

- [Router.tsx](./src/router/components/Router.tsx)：扫描页面文件、组装路由，并为独立页面提供延迟加载与错误边界。
- [路由工具](./src/router/utils/helper.tsx)：通过 `handleRoutes()` 推导路由、包装 `React.lazy`，并检查前端路由是否存在。
- [排除配置](./src/router/utils/config.ts)：定义不参与自动路由生成的目录与文件。
- [Layout](./src/layouts/index.tsx)：恢复用户与菜单状态，管理内容区加载、错误展示及页面缓存。

## 状态与标签缓存

| 状态模块 | 职责 |
| --- | --- |
| [user](./src/stores/user.ts) | 用户信息与权限 |
| [menu](./src/stores/menu.ts) | 菜单列表、选中项、展开项与折叠状态 |
| [tabs](./src/stores/tabs.ts) | 标签列表、当前标签与导航状态 |
| [public](./src/stores/public.ts) | 主题、全屏、刷新与页面缓存引用 |

[useCommonStore](./src/hooks/useCommonStore.ts) 聚合状态并按字段订阅。布局使用 `keepalive-for-react` 缓存标签页，页面可通过 `useEffectOnActive()` 在激活时执行逻辑；独立操作页面的标签与导航由 [useSingleTab](./src/hooks/useSingleTab.ts) 配置。

## 权限与菜单

- [权限工具](./src/utils/permissions.ts)：提供 `checkPermission`。
- [菜单加载](./src/menus/utils/load.ts)：登录与布局共用的菜单恢复流程，动态菜单通过 `/menu/list` 接口获取。
- [菜单工具](./src/menus/utils/helper.ts)：处理菜单权限、搜索、导航与首个可访问页面。菜单的 `rule` 用于控制可见性，没有 `rule` 时不受该字段限制。
- [静态菜单入口](./src/menus/index.ts)：导出 `defaultMenus`。

页面权限与操作按钮的实际用法参考 [菜单管理](./src/pages/system/menu/index.tsx)。

## 表单、表格与请求

| 实现入口 | 用途 |
| --- | --- |
| [表单组件映射](./src/components/Form/utils/componentMap.tsx) | 将 `BaseFormList` 中的组件名称映射为实际组件 |
| [字段长度](./src/utils/fieldLimits.ts) | 集中定义已确认的业务字段长度 |
| [用户模型](./src/pages/system/user/model.tsx) | 搜索项、表格列与表单配置的实际示例 |
| [BaseTable](./src/components/Table/BaseTable.tsx) | 表格列筛选、拖拽列宽、斑马纹及虚拟滚动；`isVirtual` 开启虚拟滚动，`isAuthHeight` 自动计算高度 |
| [BaseModal](./src/components/Modal/BaseModal.tsx) | 对话框加载、拖拽与全屏展示 |
| [请求实例](./src/utils/request.ts) | 注入接口地址、认证过期处理和国际化错误兜底文案 |
| [请求子包](./packages/request/src/index.ts) | 创建共享请求实例，处理认证与通用错误 |

接口方法的实际示例见 [用户接口](./src/servers/system/user.ts)，页面组合方式见 [用户管理](./src/pages/system/user/index.tsx)。

## 构建与国际化

- [Vite 配置](./vite.config.ts)、[构建选项](./build/vite/build.ts)、[插件入口](./build/plugins/index.ts)：Vite 8 使用 Rolldown + Oxc 与 `@vitejs/plugin-react`，面向现代浏览器，不生成 legacy 构建产物。
- [国际化入口](./src/locales/config.ts)：初始化 `react-i18next` 与 `i18next-browser-languagedetector`。
- [图标入口](./src/utils/icons.ts)：初始化项目图标。可通过 [Iconify 图标库](https://icon-sets.iconify.design/) 查找图标，编辑器扩展 `Iconify IntelliSense` 提供预览与补全。

需要修改现有行为时，优先查看上述实现与调用方，避免根据文档中的示例重写已有逻辑。
