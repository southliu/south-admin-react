#!/bin/bash
# 代码生成包装脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/generate.py"

# 检查 Python 是否可用
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装或不在 PATH 中"
    exit 1
fi

# 执行 Python 脚本，传入配置 JSON
python3 "$PYTHON_SCRIPT" "$1"
