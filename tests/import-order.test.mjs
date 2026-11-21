import { Linter } from 'eslint';
import importOrder from '../scripts/eslint/import-order.mjs';
import tseslint from 'typescript-eslint';
import assert from 'node:assert/strict';
import test from 'node:test';

const linter = new Linter();
const config = [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { local: { rules: { 'import-order': importOrder } } },
    rules: { 'local/import-order': 'error' },
  },
];
const fix = (code) => linter.verifyAndFix(code, config, { filename: 'example.ts' });

test('导入按类型、具名、默认分组，组内长度降序，修复可重复执行', () => {
  const input = [
    "import I18n from '@/components/I18n';",
    "import { useState, useRef, useEffect } from 'react';",
    "import type { FormProps } from 'antd';",
    "import { useLocation, useNavigate } from 'react-router-dom';",
    "import type { ThemeType } from '@/stores/public';",
    "import PasswordStrength from '@/components/PasswordStrength';",
    "import { Form, Button, Input } from 'antd';",
  ];
  const expected = [input[4], input[2], input[3], input[1], input[6], input[5], input[0]].join(
    '\n',
  );
  const result = fix(input.join('\n'));
  assert.equal(result.output, expected);
  assert.deepEqual(result.messages, []);
  assert.equal(fix(result.output).fixed, false);
});

test('等长保持原序，保留副作用导入和注释边界', () => {
  const code = [
    "import B from 'b';",
    "import A from 'a';",
    "import './init';",
    '// theme initialization',
    "import Theme from './theme'; // must stay attached",
    "import type { T } from './types';",
  ].join('\n');
  assert.equal(fix(code).output, code);
});
