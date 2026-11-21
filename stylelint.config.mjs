export default {
  extends: ['@south/stylelint'],
  root: true,
  overrides: [
    {
      files: ['**/reset.less'],
      // reset 样式有意覆盖历史 HTML 标签。
      rules: { 'selector-no-deprecated': null },
    },
  ],
};
