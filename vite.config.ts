import { defineConfig, loadEnv } from 'vite';
import { handleEnv } from './build/utils/helper';
import { createProxy } from './build/vite/proxy';
import { createVitePlugins } from './build/plugins';
import { buildOptions } from './build/vite/build';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const root = process.cwd();
  const env = loadEnv(mode, root);
  const viteEnv = handleEnv(env);
  const { VITE_SERVER_PORT, VITE_PROXY } = viteEnv;

  return {
    base: '/',
    plugins: createVitePlugins(),
    resolve: {
      alias: {
        '@': '/src',
        '#': '/types',
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          charset: false,
        },
      },
    },
    server: {
      open: true,
      port: VITE_SERVER_PORT,
      // 跨域处理
      proxy: createProxy(VITE_PROXY),
      // 减少文件监听开销
      watch: {
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
        usePolling: false,
      },
      // HMR 优化，减少开发环境切换卡顿
      hmr: {
        overlay: true,
      },
    },
    build: buildOptions(),
  };
});
