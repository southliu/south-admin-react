import type { PluginOption } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { timePlugin } from './time';
import { nojekyllPlugin } from './nojekyll';
import { autoImportPlugin } from './autoImport';
import { versionUpdatePlugin } from './version';
import react from '@vitejs/plugin-react-swc';
import unocss from 'unocss/vite';
import legacy from '@vitejs/plugin-legacy';
import viteCompression from 'vite-plugin-compression';

export function createVitePlugins() {
  const isDev = process.env.NODE_ENV === 'development';
  
  // 插件参数
  const vitePlugins: PluginOption[] = [
    // React SWC 插件，配置以支持 React 19
    react({
      // 确保使用正确的 JSX 运行时
      tsDecorators: false,
    }),
    unocss(),
    // 自动导入
    autoImportPlugin(),
  ];

  // 生产环境才启用这些插件
  if (!isDev) {
    vitePlugins.push(
      // 压缩包
      viteCompression(),
      // 兼容低版本
      legacy({
        targets: [ 
          'Android > 39', 
          'Chrome >= 60', 
          'Safari >= 10.1', 
          'iOS >= 10.3', 
          'Firefox >= 54', 
          'Edge >= 15', 
        ], 
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      }),
      // 版本控制
      versionUpdatePlugin(),
      // 生成 .nojekyll 空文件
      nojekyllPlugin(),
      // 包分析
      visualizer({
        gzipSize: true,
        brotliSize: true,
      }),
      // 打包时间
      timePlugin(),
    );
  }

  return vitePlugins;
}
