<div align="center">
	<h1>South Admin React</h1>
</div>


如果您觉得该项目对您有所帮助或者您喜欢我们的项目，请在 GitHub 上给我们一个 ⭐️。如果您有改进或新增功能的意愿欢迎提交 issues，感谢您的支持！

## ✨ 简介

使用`React`,`Typescript`,`Vite`,`Antd`等主流技术开发的开箱即用的中后台前端项目，`Vite`实现自动生成路由，支持`KeepAlive`功能，`zustand`状态管理，支持虚拟滚动表格，`UnoCss`开发样式。

## 🚀 项目演示
[演示地址](https://southliu.top/)
<img width="1920" height="922" alt="image" src="https://github.com/user-attachments/assets/943f1ca2-9ad3-45cc-83aa-7a3d18984653" />

![02.gif](https://github.com/southliu/github-static/blob/main/react-admin/02.gif)

| ![03.gif](https://github.com/southliu/github-static/blob/main/react-admin/03.gif) | ![04.gif](https://github.com/southliu/github-static/blob/main/react-admin/04.gif) |
| --- | --- |

## 💻 安装使用

- 获取项目代码

```bash
git clone --depth 1 https://github.com/southliu/south-admin-react.git
```

- 选择目录

```bash
cd south-admin-react
```

- 安装全局依赖依赖，存在则不用安装

```bash
npm i -g pnpm
```

- 安装依赖
```bash
pnpm install -w
```
##### 如果使用pnpm安装依赖出现安装失败问题，请使用梯子、yarn安装或切换淘宝源。
```bash
pnpm config set registry https://registry.npmmirror.com
```
##### pnpm（v10+ /v11）的安全机制：默认禁止依赖包的 postinstall 等构建脚本，防止恶意代码，执行以下命令。
```bash
pnpm approve-builds
```

- 运行

```bash
pnpm dev
```

- 打包

```bash
pnpm build
```

- 分析打包体积（生成项目根目录下的 `stats.html`）

```bash
pnpm build:analyze
```

## 🧪 回归测试

```bash
pnpm test             # Node 原生回归测试
```

首次运行浏览器测试，或升级 `@playwright/test` 后，先安装配套 Chromium，再执行测试：

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

若出现 `browserType.launch: Executable doesn't exist`，表示配套浏览器尚未安装，请重新执行安装命令。浏览器版本要求见 [Playwright 官方说明](https://playwright.dev/docs/browsers#install-browsers)。

也可以使用本机已安装的 Google Chrome：

```bash
pnpm exec cross-env PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e
```

## 🌐 后端项目
![Go](https://img.shields.io/badge/-Go-black?style=plastic&logo=go) [south-admin-gin](https://github.com/southliu/south-admin-gin)<br/>
![Python](https://img.shields.io/badge/-Python-black?style=plastic&logo=python) [south-admin-fastApi](https://github.com/southliu/south-admin-fastApi)<br/>
![Python](https://img.shields.io/badge/-Python-black?style=plastic&logo=python) [south-admin-django](https://github.com/southliu/south-admin-django)<br/>
![Nest](https://img.shields.io/badge/-Nest-black?style=plastic&logo=node.js) [south-admin-nest](https://github.com/southliu/south-admin-nest)<br/>

## ✈️ 快速编码
1. 使用Claude Code的skills（**推荐**）：
开启Claude Code之后执行`/demo-create`之后一步一步输入。

2. 使用vscode的代码片段，在`.vscode/south.code-snippets`文件中预设了`demoPage`、`demoModel`、`demoApi`等常用代码片段，后续对代码片段不满意可以修改对应的body代码。
   
	2.1 打开vscode，在`src/pages`目录下创建你所需的文件夹，以log为例，创建一个`log`文件夹。
   
	2.2 在`log`文件夹下创建`model.ts`文件，在该文件下输入`demoModel`后回车，会出现对应的代码片段。
   
	2.3 在`src/servers`文件夹下面创建一个`log.ts`文件，在该文件下输入`demoApi`后回车，将XXX改为Log，将xxx改为接口路由。
   
	2.4 在`log`文件夹下创建`index.ts`文件，在该文件下输入`demoPage`后回车，将XXX改为Log，将xxx改为对应权限表示。

## 🧹 项目初始化（清除示例内容）

项目内置了演示用的示例内容（demo 页面、content 文章模块、Github 角标等），开始业务开发前可一键清除。清除过程会连带删除代码中的 `import` 与 JSX 引用，避免遗留悬空引用。

> ⚠️ 该操作不可逆，建议在干净的 git 工作区执行，方便回滚。

### 方式一：pnpm 脚本（推荐）

```bash
pnpm init:project
```

执行后会先 `dry-run` 预览将要删除的文件和将要修改的引用，确认后才真正执行。也可直接传参：

```bash
pnpm run init:project -- --dry-run   # 仅预览，不删除
pnpm run init:project -- --yes       # 跳过确认直接执行
```

### 方式二：Claude Code Skill

在 Claude Code 中执行 `/init-project`，会调用同一套清理脚本并交互确认。

### 方式三：直接运行脚本

```bash
# 预览
python .claude/skills/init-project/scripts/cleanup.py --dry-run
# 执行
python .claude/skills/init-project/scripts/cleanup.py
```

### 清理范围

| 类型 | 目标 |
| --- | --- |
| 页面 | `src/pages/demo/`、`src/pages/content/` |
| 组件 | `src/components/Github/` |
| 接口 | `src/servers/content/` |
| 静态菜单 | `src/menus/demo.ts` 及 `src/menus/index.ts` 中的 demo 引用 |
| 国际化 | `src/locales/zh/content.ts`、`src/locales/en/content.ts` |
| 代码引用 | `src/layouts/components/Header.tsx` 中的 Github 引用 |

清理完成后，建议执行 `pnpm lint` 和 `pnpm dev` 验证项目正常运行。完整说明见 `.claude/skills/init-project/SKILL.md`。

## 📁 项目结构

```tree
south-admin-react
├── build                     # 构建相关配置
│   ├── utils                 # 构建工具函数
│   └── vite                  # vite 配置
├── packages                  # monorepo子包
│   ├── message               # 消息模块
│   ├── request               # 请求模块
│   ├── stylelintConfig      # stylelint配置
│   └── utils                 # 工具函数
├── public                    # 静态资源
├── src                       # 源代码
│   ├── assets                # 静态资源
│   │   ├── css               # 样式文件
│   │   └── fonts             # 字体文件
│   ├── components            # 公共组件
│   │   ├── Form              # 表单组件
│   │   └── Table             # 表格组件
│   ├── layouts               # 布局组件
│   │   └── components        # 布局子组件
│   ├── locales               # 国际化配置
│   ├── menus                 # 菜单配置
│   ├── pages                 # 页面
│   │   ├── content           # 内容管理
│   │   └── system            # 系统管理
│   ├── router                # 路由配置
│   ├── servers               # API 接口
│   ├── stores                # 状态管理
│   └── utils                 # 工具函数
├── types                     # TS类型定义
├── .eslintrc.cjs             # ESLint 配置
├── .gitignore                # Git 忽略文件
├── index.html                # HTML 模板
├── package.json              # 项目依赖
├── tsconfig.json             # TypeScript 配置
└── vite.config.ts            # Vite 配置
```

## 🧩 图标(iconify)

- 参考 [iconify官方地址](https://icon-sets.iconify.design/)
- VS Code安装Iconify IntelliSense - 图标内联显示和自动补全

## 🎗️ Git 提交示例
### Git提交不规范会导致无法提交，`feat`关键字可以按照下面`Git 贡献提交规范`来替换。
```
git add .
git commit -m "feat: 新增功能"
git push
```
### 按照以上规范依旧无法提交代码，请在终端执行`npx husky install`之后重新提交。

## 🎯 Git 贡献提交规范

- 参考 [vue](https://github.com/vuejs/vue/blob/dev/.github/COMMIT_CONVENTION.md) 规范

  - `feat` 增加新功能
  - `fix` 修复问题/BUG
  - `style` 代码风格相关无影响运行结果的
  - `perf` 优化/性能提升
  - `refactor` 重构
  - `revert` 撤销修改
  - `test` 测试相关
  - `docs` 文档/注释
  - `chore` 依赖更新/脚手架配置修改等
  - `workflow` 工作流改进
  - `ci` 持续集成
  - `types` 类型定义文件更改
  - `wip` 开发中

## 🐵 关于封装
  1. 功能扩展，在原有的api上拓展。
  2. 功能整合，合并两个或两个以上组件的api。
  3. 样式统一，避免后期样式变动，导致牵一发而动全身。
  4. 公共组件二次封装或常用组件使用**Base**开头，便于区分。

## 📕 Q&A常见问题
#### 1. 页面权限如何配置？
1. 通过登录接(/user/login)或重新授权接口(/user/refresh-permissions)获取permissions权限数据。
2. 通过菜单接口(/menu/list)获取data中的rule权限数据，这个rule数据影响菜单显示，如果没返回rule则一直都显示。
3. 页面内权限参考src/pages/system/menu.index.tsx文件内的pagePermission数据，pagePermission.page是显示页面的权限，根据第一点返回的permissions进行匹配。

#### 2. 路由如何配置？
路由根据文件夹路径自动生成，路径包含以下文件名或文件夹名称则不生成：

* login
* forget
* components
* utils
* lib
* hooks
* model.tsx
* 404.tsx

可自行在 src/router/utils/config.ts 修改路由生成规则。

#### 3. 菜单如何配置？
提供了两种方式配置菜单：
1. 动态菜单，通过菜单接口(/menu/list)获取菜单数据。
2. 静态菜单，需要静态菜单将/src/hooks/useCommonStore.ts中的useCommonStore中的menuList改为defaultMenus。
```js
// src/hooks/useCommonStore.ts
import { defaultMenus } from '@/menus';

// const menuList = useMenuStore(state => state.menuList);
// 菜单数据
const menuList = defaultMenus;
```

#### 4. @south/xxx依赖在哪查看？
通过根目录`packages`文件中查看对于xxx文件的源码进行修改。

#### 5. 安装新依赖时报错？
使用了monorepo项目安装新依赖时需要在后面添加`-w`或`--workspace`，否则会报错，比如：`pnpm i mobx -w`。

#### 6. 无法执行build？
`pnpm build` 会先执行 TypeScript 检查。若提示缺少标识符，请补充对应的显式导入；类型使用 `import type`，无需先启动开发服务器。

## 部署与版本更新

执行 `pnpm build`，完整发布 `dist/`。页面会自动检测新版本并刷新；保留上一版哈希资源，避免旧页面请求文件时出现 404。

以下配置合入现有 Nginx `server`，沿用其 `root`；已有同名 `location` 时合并，部署在子路径时调整对应路径。

```nginx
    root /usr/share/nginx/html;
    index index.html;

    # 静态页面
    location / {
        add_header Cache-Control "no-cache" always;
        try_files $uri $uri/ /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-cache" always;
    }

    location = /version.json {
        add_header Cache-Control "no-store" always;
        try_files $uri =404;
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }
```

执行 `nginx -t`，通过后重载。使用 CDN 时同步缓存规则，并清理旧首页和版本文件缓存。

## 🧡 捐赠
如果您觉得这个项目对您有帮助，您可以帮作者买一杯咖啡表示支持!

| 微信 | 支付宝 |
| --- | --- |
| <img src="https://github.com/southliu/github-static/blob/main/pay/wechat.jpg" width="250" alt="wechat"> | <img src="https://github.com/southliu/github-static/blob/main/pay/alipay.jpg" width="250" alt="alipay">  |

### 维护中的依赖替代

crypto-js 已替换为 crypto-es 3.1.3，AES 缓存格式和 MD5 协议保持兼容，由 `tests/crypto.test.mjs` 验证旧密文读取和新密文往返。

暂停维护的 wangEditor 已替换为 wangEditor-next 6.7.0，并同步更新 React 包装器。保留 HTML 值、工具栏和原图片/视频上传接口。v6 可导入旧 HTML；视频输出改用 figure 容器与 data-w-e-align，服务端若配置 HTML 白名单，需要允许这些元素和属性。详见[官方迁移说明](https://wangeditor-next.github.io/docs/en/guide/migration-v6)。
