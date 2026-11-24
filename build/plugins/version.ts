import type { PluginOption } from 'vite';

/** 将同一个构建版本写入前端代码和版本文件 */
export const versionUpdatePlugin = (): PluginOption => {
  const version = String(Date.now());

  return {
    name: 'version-update',
    config() {
      return { define: { 'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(version) } };
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version }),
      });
    },
  };
};
