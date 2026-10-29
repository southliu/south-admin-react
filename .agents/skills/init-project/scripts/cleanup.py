#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
init-project 清理脚本

删除模板自带的示例内容，并连带清理代码中的引用。
默认 dry-run 预览；不带 --dry-run 时真正执行删除与替换。

用法:
    python .claude/skills/init-project/scripts/cleanup.py --dry-run
    python .claude/skills/init-project/scripts/cleanup.py
    python .claude/skills/init-project/scripts/cleanup.py --root /path/to/project --dry-run
"""

import argparse
import os
import sys
import shutil

# 在 Windows 上强制 stdout/stderr 使用 UTF-8，避免 print 中文时触发 GBK 编码错误导致脚本中途崩溃
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except (AttributeError, OSError):
        pass

# 待删除的文件/目录（相对项目根目录）
DELETE_TARGETS = [
    "src/pages/demo",
    "src/pages/content",
    "src/components/Github",
    "src/servers/content",
    "src/menus/demo.ts",
    "src/locales/zh/content.ts",
    "src/locales/en/content.ts",
]

# 待修改的引用文件 -> [精确匹配字符串列表]
# 每个字符串会在文件内容中出现时被移除（含末尾换行）
EDIT_TARGETS = {
    "src/layouts/components/Header.tsx": [
        "import Github from '@/components/Github';\n",
        "          <Github />\n",
    ],
    "src/menus/index.ts": [
        "import { demo } from './demo';\n",
        "  ...(demo as SideMenu[]),\n",
    ],
}


def find_project_root(explicit: str | None = None) -> str:
    """确定项目根目录：优先用 --root，否则从 CWD 向上查找包含 package.json 的目录。"""
    if explicit:
        candidate = os.path.abspath(explicit)
        if os.path.isfile(os.path.join(candidate, "package.json")):
            return candidate
        # 即使没有 package.json 也接受显式指定的路径
        return candidate

    cwd = os.getcwd()
    current = cwd
    for _ in range(10):
        if os.path.isfile(os.path.join(current, "package.json")):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent
    return cwd


def collect_delete_plan(root: str) -> list[tuple[str, str, str]]:
    """返回 [(相对路径, 绝对路径, 类型|'missing')]，仅包含存在的目标。"""
    plan = []
    for rel in DELETE_TARGETS:
        abs_path = os.path.join(root, rel)
        if os.path.isdir(abs_path):
            plan.append((rel, abs_path, "dir"))
        elif os.path.isfile(abs_path):
            plan.append((rel, abs_path, "file"))
        else:
            plan.append((rel, abs_path, "missing"))
    return plan


def collect_edit_plan(root: str) -> list[tuple[str, str, list[str], list[str]]]:
    """返回 [(相对路径, 绝对路径, [匹配串...], [存在的匹配串...])]。"""
    plan = []
    for rel, needles in EDIT_TARGETS.items():
        abs_path = os.path.join(root, rel)
        if not os.path.isfile(abs_path):
            plan.append((rel, abs_path, needles, []))
            continue
        try:
            with open(abs_path, "r", encoding="utf-8") as f:
                content = f.read()
        except OSError:
            plan.append((rel, abs_path, needles, []))
            continue
        present = [n for n in needles if n in content]
        plan.append((rel, abs_path, needles, present))
    return plan


def print_plan(root: str, delete_plan, edit_plan) -> None:
    print("=" * 60)
    print(f"项目根目录: {root}")
    print("=" * 60)

    print("\n[1] 待删除的文件 / 目录:")
    if not any(t != "missing" for *_, t in delete_plan):
        print("  （无）")
    for rel, abs_path, kind in delete_plan:
        if kind == "missing":
            print(f"  - {rel}  [已不存在，跳过]")
        else:
            label = "目录" if kind == "dir" else "文件"
            print(f"  - {rel}  [{label}]")

    print("\n[2] 待修改的引用文件:")
    any_edit = False
    for rel, abs_path, needles, present in edit_plan:
        if not present:
            if os.path.isfile(abs_path):
                print(f"  - {rel}  [未找到匹配的引用，跳过]")
            else:
                print(f"  - {rel}  [文件不存在，跳过]")
            continue
        any_edit = True
        for needle in present:
            preview = needle.rstrip("\n")
            print(f"  - {rel}  移除: {preview!r}")
    if not any_edit:
        print("  （无）")
    print()


def run_cleanup(root: str, delete_plan, edit_plan) -> None:
    deleted = 0
    for rel, abs_path, kind in delete_plan:
        if kind == "dir":
            shutil.rmtree(abs_path, ignore_errors=False)
            print(f"  ✓ 删除目录: {rel}")
            deleted += 1
        elif kind == "file":
            os.remove(abs_path)
            print(f"  ✓ 删除文件: {rel}")
            deleted += 1
        else:
            print(f"  - 跳过(不存在): {rel}")

    edited = 0
    for rel, abs_path, needles, present in edit_plan:
        if not present:
            print(f"  - 跳过(无匹配): {rel}")
            continue
        with open(abs_path, "r", encoding="utf-8") as f:
            content = f.read()
        for needle in present:
            content = content.replace(needle, "", 1)
        with open(abs_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✓ 修改引用: {rel}  (移除 {len(present)} 处)")
        edited += 1

    print(f"\n完成: 删除 {deleted} 项，修改 {edited} 个文件。")


def main() -> int:
    parser = argparse.ArgumentParser(description="清理模板示例内容")
    parser.add_argument("--dry-run", action="store_true", help="仅预览，不执行删除")
    parser.add_argument("--root", default=None, help="项目根目录（默认自动检测）")
    args = parser.parse_args()

    root = find_project_root(args.root)

    if not os.path.isfile(os.path.join(root, "package.json")):
        print(f"⚠️  未在 {root} 找到 package.json，请确认项目根目录是否正确。", file=sys.stderr)
        print("   可通过 --root <path> 显式指定。", file=sys.stderr)

    delete_plan = collect_delete_plan(root)
    edit_plan = collect_edit_plan(root)

    print_plan(root, delete_plan, edit_plan)

    if args.dry_run:
        print("[dry-run] 未做任何修改。确认无误后去掉 --dry-run 执行实际删除。")
        return 0

    print("开始执行清理...")
    run_cleanup(root, delete_plan, edit_plan)
    print("\n建议运行 `pnpm lint` 与 `pnpm dev` 验证项目正常运行。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
