# 前端优化与验证

依赖使用 pnpm 11.9.0 和仓库内的 `pnpm-lock.yaml` 固定。安装使用
`pnpm install -w --frozen-lockfile`。GitHub Actions 对提交和 PR 运行检查，
远程执行结果需在提交后查看。

## 请求与下拉组件

- 相同方法、URL、参数和 JSON 数据的请求会取消前一个请求；不同数据的提交不会互相取消。
- 取消、网络错误和 HTTP 错误保留 Promise rejection；后端业务响应继续使用 `{ code, message, data }`。
- 业务 `code: 401` 与 HTTP 401 共享登录过期处理，旧账号响应不能清除新账号会话。
- 未携带令牌的 401 正常显示后端错误或国际化兜底文案，不触发会话过期跳转。
- `src/servers/` 方法直接返回请求。菜单恢复由 `src/menus/utils/load.ts` 供调用方共用。接口失败优先展示后端有效的 `message/detail`；没有报错信息时统一使用 `public.networkError` 国际化文案（中文：网络异常，请稍后重试）。
- 三种 API 下拉响应 `params`、`disabled`、`fieldNames` 等属性更新。过期结果不写回选项，分页搜索不修改调用方参数。
- 表格使用 Ant Design 原生虚拟滚动，列宽、筛选与排序状态独立保存。

## 离线图标和路由

`scripts/generate-icons.mjs` 从源码中的静态图标名称和后端默认菜单图标生成首屏子集。
其余图标集合输出到 `public/icons/*.json`，由浏览器按需从本站获取，不依赖外部图标 API。
生成文件随构建发布；`public/icons/` 不进入版本管理。新增图标后运行开发或构建脚本即可更新。

登录后访问页面时才执行相应的路由动态导入，不再在空闲回调中批量导入整个 pages 目录。

## 输入边界

`src/utils/fieldLimits.ts` 对应后端 `models/system/` 的列长度：用户相关字段为
100/20，菜单名称 50、路由 255、图标及权限标识 100，角色名称 50，文章标题 200。
密码遵循 bcrypt 的 72 字节上限；MySQL TEXT 按 65535 字节验证，避免多字节字符溢出。
后端 schema 的后续维护由后端项目负责，字段变化时应同步前端常量和边界测试。

## 复跑

导入排序由本地 ESLint 规则维护：`import type` → 具名导入 → 默认导入，组内按语句
长度降序，等长保留原序。`pnpm lint` 自动修复，`pnpm lint:check` 在 CI 中检查。
副作用导入和注释作为边界保留，避免改变初始化顺序或注释归属。

```powershell
pnpm lint
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
```

Windows 已安装 Edge 时，可用下面的命令运行浏览器测试：

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
pnpm test:e2e
```

浏览器回归使用内存 API 响应，不写业务数据库；覆盖菜单失败恢复、展开/收起、
表单长度、离线图标、按需路由、下拉联动、搜索竞态和万行虚拟滚动。
截图、失败 trace 和 JSON 结果位于 `.codex-temp/evidence/`。测试服务使用 5189 端口，
测试结束自动关闭。真实后端数据库 CRUD 和远程 CI 执行不包含在这些本地回归结论内。
