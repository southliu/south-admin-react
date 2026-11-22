import type { PluginOption } from 'vite';

/** 显示打包时间插件 */
export const timePlugin = (): PluginOption => {
  return {
    name: 'vite-build-time',
    enforce: 'pre',
    apply: 'build',
    buildStart: () => {
      console.time('打包时间');
    },
    buildEnd: () => {
      // console.timeEnd('\n模块转义完成时间')
    },
    /** 在服务器关闭时被调用 */
    closeBundle: () => {
      console.timeEnd('打包时间');
    },
  };
};
