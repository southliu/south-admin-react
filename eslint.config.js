import importOrder from './scripts/eslint/import-order.mjs';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import js from '@eslint/js';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,mjs,jsx,ts,tsx}'],
    ignores: ['.agents/**', '.claude/**'],
    plugins: { local: { rules: { 'import-order': importOrder } } },
    rules: { 'local/import-order': 'error' },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-var': 'error',
      // "prettier/prettier": "error",
      // 禁止出现console
      'no-console': 'off',
      // 禁用debugger
      'no-debugger': 'warn',
      // 禁止出现重复的 case 标签
      'no-duplicate-case': 'warn',
      // 禁止出现空语句块
      'no-empty': 'warn',
      // 禁止不必要的括号
      'no-extra-parens': 'off',
      // 禁止对 function 声明重新赋值
      'no-func-assign': 'warn',
      // 禁止在 return、throw、continue 和 break 语句之后出现不可达代码
      'no-unreachable': 'warn',
      // 强制所有控制语句使用一致的括号风格
      curly: 'off',
      // 要求 switch 语句中有 default 分支
      'default-case': 'warn',
      // 强制尽可能地使用点号
      'dot-notation': 'warn',
      // 要求使用 === 和 !==
      eqeqeq: 'warn',
      // 禁止 if 语句中 return 语句之后有 else 块
      'no-else-return': 'warn',
      // 禁止出现空函数
      'no-empty-function': 'warn',
      // 禁用不必要的嵌套块
      'no-lone-blocks': 'warn',
      // 禁止使用多个空格
      'no-multi-spaces': 'warn',
      // 禁止多次声明同一变量
      'no-redeclare': 'warn',
      // 禁止在 return 语句中使用赋值语句
      'no-return-assign': 'warn',
      // 禁用不必要的 return await
      'no-return-await': 'warn',
      // 禁止自我赋值
      'no-self-assign': 'warn',
      // 禁止自身比较
      'no-self-compare': 'warn',
      // 禁止不必要的 catch 子句
      'no-useless-catch': 'warn',
      // 禁止多余的 return 语句
      'no-useless-return': 'warn',
      // 禁止变量声明与外层作用域的变量同名
      'no-shadow': 'off',
      // 允许delete变量
      'no-delete-var': 'off',
      // 强制数组方括号中使用一致的空格
      'array-bracket-spacing': 'warn',
      // 强制在代码块中使用一致的大括号风格
      'brace-style': 'warn',
      // 强制使用骆驼拼写法命名约定
      camelcase: 'off',
      // 强制使用一致的缩进
      indent: 'off',
      // 强制在 JSX 属性中一致地使用双引号或单引号
      // "jsx-quotes": "warn",
      // 强制可嵌套的块的最大深度4
      'max-depth': 'warn',
      // 强制最大行数 300
      // "max-lines": ["warn", { "max": 1200 }],
      // 强制函数最大代码行数 50
      // "max-lines-per-function": ["warn", { max: 70 }],
      // 强制函数块最多允许的的语句数量20
      'max-statements': ['warn', 100],
      // 强制回调函数最大嵌套深度
      'max-nested-callbacks': ['warn', 3],
      // 强制函数定义中最多允许的参数数量
      'max-params': ['warn', 3],
      // 强制每一行中所允许的最大语句数量
      'max-statements-per-line': ['warn', { max: 1 }],
      // 要求方法链中每个调用都有一个换行符
      'newline-per-chained-call': ['warn', { ignoreChainWithDepth: 3 }],
      // 禁止 if 作为唯一的语句出现在 else 语句中
      'no-lonely-if': 'warn',
      // 禁止空格和 tab 的混合缩进
      'no-mixed-spaces-and-tabs': 'warn',
      // 禁止出现多行空行
      'no-multiple-empty-lines': ['warn', { max: 1 }],
      // 禁止出现;
      semi: ['warn', 'always'],
      // 强制在块之前使用一致的空格
      'space-before-blocks': 'warn',
      // 强制在 function的左括号之前使用一致的空格
      // "space-before-function-paren": ["warn", "never"],
      // 强制在圆括号内使用一致的空格
      'space-in-parens': 'warn',
      // 要求操作符周围有空格
      'space-infix-ops': 'warn',
      // 强制在一元操作符前后使用一致的空格
      'space-unary-ops': 'warn',
      // 强制在注释中 // 或 /* 使用一致的空格
      // "spaced-comment": "warn",
      // 强制在 switch 的冒号左右有空格
      'switch-colon-spacing': 'warn',
      // 强制箭头函数的箭头前后使用一致的空格
      'arrow-spacing': 'warn',
      'prefer-const': 'warn',
      'prefer-rest-params': 'warn',
      'no-useless-escape': 'off',
      'no-irregular-whitespace': 'warn',
      'no-prototype-builtins': 'off',
      'no-fallthrough': 'warn',
      'no-extra-boolean-cast': 'warn',
      'no-case-declarations': 'off',
      'no-async-promise-executor': 'warn',
      // 禁止使用后缀运算符的非空断言"!"
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // 官方hooks校验
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
);
