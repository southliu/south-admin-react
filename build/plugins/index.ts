import type { PluginOption } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { timePlugin } from './time';
import { autoImportPlugin } from './autoImport';
import { versionUpdatePlugin } from './version';
import react from '@vitejs/plugin-react-swc';
import unocss from 'unocss/vite';
import viteCompression from 'vite-plugin-compression';

export function createVitePlugins() {
  // 插件参数
  const vitePlugins: PluginOption[] = [
    react(),
    unocss(),
    // 版本控制
    versionUpdatePlugin(),
    // 自动导入
    autoImportPlugin(),
    // 包分析
    visualizer({
      gzipSize: true,
      brotliSize: true,
    }),
    // 打包时间
    timePlugin(),
    // 压缩包
    viteCompression(),
  ];

  return vitePlugins;
}
