import type { PluginOption } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { versionUpdatePlugin } from './version.ts';
import { nojekyllPlugin } from './nojekyll.ts';
import { timePlugin } from './time.ts';
import viteCompression from 'vite-plugin-compression';
import react from '@vitejs/plugin-react';
import unocss from 'unocss/vite';

export function createVitePlugins() {
  const isDev = process.env.NODE_ENV === 'development';

  // 插件参数
  const vitePlugins: PluginOption[] = [react(), unocss()];

  // 生产环境才启用这些插件
  if (!isDev) {
    vitePlugins.push(
      // 压缩包
      viteCompression(),
      // 版本控制
      versionUpdatePlugin(),
      // 生成 .nojekyll 空文件
      nojekyllPlugin(),
      // 打包时间
      timePlugin(),
    );

    if (process.env.ANALYZE === 'true') {
      vitePlugins.push(
        visualizer({
          gzipSize: true,
          brotliSize: true,
        }),
      );
    }
  }

  return vitePlugins;
}
