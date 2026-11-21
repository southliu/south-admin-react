const group = (node) =>
  node.importKind === 'type'
    ? 0
    : node.specifiers.every((specifier) => specifier.type === 'ImportSpecifier')
      ? 1
      : 2;

export default {
  meta: {
    type: 'layout',
    fixable: 'code',
    schema: [],
    messages: {
      order: '导入按 type、具名、默认分组；组内按语句长度降序排列。',
    },
  },
  create(context) {
    const source = context.sourceCode;
    const length = (node) => source.getText(node).replace(/\s+/g, ' ').length;
    const check = (nodes) => {
      const sorted = [...nodes].sort((a, b) => group(a) - group(b) || length(b) - length(a));
      if (nodes.every((node, index) => node === sorted[index])) return;
      context.report({
        node: nodes[0],
        messageId: 'order',
        fix: (fixer) =>
          fixer.replaceTextRange(
            [nodes[0].range[0], nodes.at(-1).range[1]],
            sorted.map((node) => source.getText(node)).join('\n'),
          ),
      });
    };
    return {
      Program(program) {
        let nodes = [];
        for (const node of program.body) {
          // Side effects and comments are boundaries so fixing cannot reorder initialization or detach comments.
          if (
            node.type !== 'ImportDeclaration' ||
            !node.specifiers.length ||
            (nodes.length && source.text.slice(nodes.at(-1).range[1], node.range[0]).trim())
          ) {
            check(nodes);
            nodes = [];
          }
          if (node.type === 'ImportDeclaration' && node.specifiers.length) nodes.push(node);
        }
        check(nodes);
      },
    };
  },
};
