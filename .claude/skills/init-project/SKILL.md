---
name: init-project
description: 初始化整个项目，清除模板自带的示例内容（src/pages/demo、src/pages/content、src/components/Github、src/servers/content、menus/demo 及相关 i18n），并连带删除代码中的 import 与引用。执行时会先以 dry-run 预览将要删除的文件和将要修改的引用，经用户确认后再真正执行。
---

# init-project

## Description
初始化项目，丢弃模板自带的示例内容。该技能会调用 `.claude/skills/init-project/scripts/` 下的 Python 清理脚本，删除以下目标并连带清理代码中的引用：

- 页面：`src/pages/demo/`、`src/pages/content/`
- 组件：`src/components/Github/`
- 接口：`src/servers/content/`
- 静态菜单：`src/menus/demo.ts` 及 `src/menus/index.ts` 中的 demo 引用
- 国际化：`src/locales/zh/content.ts`、`src/locales/en/content.ts`

同时清理以下代码引用：
- `src/layouts/components/Header.tsx`：删除 `import Github from '@/components/Github';` 与 `<Github />` 标签
- `src/menus/index.ts`：删除 `import { demo } from './demo';` 与 `...(demo as SideMenu[])`

## Instructions

### 1. 执行清理脚本

调用 Python 脚本完成清理，**必须先做 dry-run 预览，再确认删除**：

```bash
# 1) dry-run 预览（不删除任何文件，仅打印将要删除的文件和将要修改的引用）
python .claude/skills/init-project/scripts/cleanup.py --dry-run

# 2) 确认无误后，真正执行删除
python .claude/skills/init-project/scripts/cleanup.py
```

或使用包装脚本（Windows 下推荐）：

```bash
bash .claude/skills/init-project/scripts/run.sh --dry-run   # 预览
bash .claude/skills/init-project/scripts/run.sh             # 执行
```

### 2. 确认流程（重要）

1. 先运行 `--dry-run`，将脚本输出的「待删除文件清单」和「待修改引用清单」展示给用户。
2. 明确询问用户是否确认执行删除。
3. 用户确认后再运行不带 `--dry-run` 的命令。
4. 执行完成后，建议运行 `pnpm lint` 和 `pnpm dev` 验证项目可正常构建运行。

### 3. 脚本行为说明

脚本（`cleanup.py`）会：

- 校验项目根目录（默认当前工作目录，可通过 `--root <path>` 指定）。
- 计算所有待删除的文件/目录（仅删除存在的）。
- 计算所有待修改的引用文件（按精确字符串匹配替换）。
- `--dry-run` 模式下只输出计划，不写盘；非 dry-run 模式下执行删除与替换，并跳过已不存在的目标。
- 仅做精确字符串替换，不会误伤业务代码；替换前会检查目标字符串是否存在。

### 4. 替换规则（精确匹配）

| 文件 | 替换内容 |
| --- | --- |
| `src/layouts/components/Header.tsx` | 删除 `import Github from '@/components/Github';\n` 整行，删除 `          <Github />\n` 整行 |
| `src/menus/index.ts` | 删除 `import { demo } from './demo';\n` 整行，将 `  ...(demo as SideMenu[]),\n` 整行删除 |

> 注：脚本使用精确字符串匹配。如果上述文件已被人为修改导致字符串不再精确匹配，脚本会跳过该替换并在输出中提示「未找到匹配」，此时需人工检查。

### 5. 安全检查

- 脚本默认不会删除脚本自身所在目录之外的任意文件，仅处理上述明确的目标。
- 所有路径均相对项目根目录计算，不会跨项目删除。
- 若目标已被删除（重复执行），脚本会安全跳过。
