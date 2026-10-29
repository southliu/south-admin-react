#!/bin/bash
# init-project 清理包装脚本
#
# 用法:
#   bash .claude/skills/init-project/scripts/run.sh --dry-run   # 预览
#   bash .claude/skills/init-project/scripts/run.sh             # 执行
#   bash .claude/skills/init-project/scripts/run.sh --root /path/to/project --dry-run

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/cleanup.py"

# 优先使用 python3，回退到 python（Windows 环境通常只有 python）
if command -v python3 &> /dev/null; then
    PY=python3
elif command -v python &> /dev/null; then
    PY=python
else
    echo "❌ Python 未安装或不在 PATH 中"
    exit 1
fi

$PY "$PYTHON_SCRIPT" "$@"
