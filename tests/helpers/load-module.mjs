import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
export function createLoader(mocks = {}, transform = (source) => source) {
  const cache = new Map();
  function load(file) {
    file = resolve(file);
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const source = transform(readFileSync(file, 'utf8'), file);
    const { outputText } = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    });
    function localRequire(id) {
      if (id in mocks) return mocks[id];
      if (id.startsWith('.') || id.startsWith('@/')) {
        const base = id.startsWith('@/') ? resolve('src', id.slice(2)) : resolve(dirname(file), id);
        const target = [
          base,
          `${base}.ts`,
          `${base}.tsx`,
          `${base}/index.ts`,
          `${base}/index.tsx`,
        ].find(existsSync);
        if (target?.endsWith('.json')) return require(target);
        if (target) return load(target);
      }
      return createRequire(file)(id);
    }
    new Function('require', 'exports', outputText)(localRequire, exports);
    return exports;
  }
  return load;
}
