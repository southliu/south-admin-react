import type { PluginOption } from 'vite';
import path from 'path';
import fs from 'fs';

export const versionUpdatePlugin = (): PluginOption => {
  let outDir = '';

  return {
    name: 'version-update',
    configResolved(resolvedConfig) {
      // 存储最终解析的配置
      outDir = resolvedConfig?.build?.outDir || 'dist';
    },
    closeBundle() {
      // 这里使用编译时间作为版本信息
      const content = JSON.stringify({ version: new Date().getTime() });
      // 定义 version.json 文件路径
      const filePath = path.join(outDir, 'version.json');

      // 如果outDir目录不存在则创建
      if (outDir && !fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      // 将 JSON 数据写入文件
      fs.writeFileSync(filePath, content, 'utf-8');
    },
  };
};
