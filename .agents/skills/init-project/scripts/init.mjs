#!/usr/bin/env node
/**
 * init-project 前端入口
 *
 * 用法（在项目根目录）:
 *   pnpm init:project             # 直接执行清理（先 dry-run 预览，确认后删除）
 *   pnpm run init:project -- --yes        # 跳过确认直接执行
 *   pnpm run init:project -- --dry-run    # 仅预览
 *
 * 该脚本会:
 *   1. 先以 dry-run 模式打印将要删除/修改的内容
 *   2. 交互式询问用户是否确认（除非传入 --yes）
 *   3. 确认后调用 cleanup.py 执行真正删除
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLEANUP_PY = join(__dirname, 'cleanup.py');

// 收集透传给 cleanup.py 的参数（过滤掉 pnpm/npm 的 "--" 分隔符）
const passthroughArgs = process.argv.slice(2).filter((a) => a !== '--');
const skipConfirm = passthroughArgs.includes('--yes') || passthroughArgs.includes('-y');
const dryRunOnly = passthroughArgs.includes('--dry-run');

function pickPython() {
  for (const cmd of ['python3', 'python']) {
    const r = spawnSync(cmd, ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' });
    if (r.status === 0) return cmd;
  }
  console.error('❌ 未找到 Python，请先安装 Python 3 并加入 PATH。');
  process.exit(1);
}

function runCleanup(extraArgs) {
  const py = pickPython();
  const args = [CLEANUP_PY, ...extraArgs.filter((a) => a !== '--yes' && a !== '-y')];
  const result = spawnSync(py, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function confirm(question) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const ans = await rl.question(question);
    return /^\s*[yY]/.test(ans);
  } finally {
    rl.close();
  }
}

async function main() {
  console.log('▶ 第 1 步：dry-run 预览（不做任何修改）\n');
  runCleanup(['--dry-run', ...passthroughArgs.filter((a) => a !== '--dry-run')]);

  if (dryRunOnly) {
    console.log('\n[dry-run] 仅预览模式，结束。如需执行请去掉 --dry-run。');
    return;
  }

  if (skipConfirm) {
    console.log('\n▶ --yes 已传入，跳过确认，开始执行清理...\n');
    runCleanup(passthroughArgs);
    console.log('\n✅ 初始化完成。建议执行 `pnpm lint` 和 `pnpm dev` 验证项目。');
    return;
  }

  const ok = await confirm('\n以上为预览内容，确认执行删除吗？[y/N] ');
  if (!ok) {
    console.log('已取消，未做任何修改。');
    return;
  }
  console.log('\n▶ 开始执行清理...\n');
  runCleanup(passthroughArgs);
  console.log('\n✅ 初始化完成。建议执行 `pnpm lint` 和 `pnpm dev` 验证项目。');
}

main();
