type FileModule = Record<string, string>;
type FileParams = Record<string, FileModule>;

/** 获取中文翻译文件 */
export const getZhLang = () => {
  const langFiles = import.meta.glob('../zh/*.ts', {
    import: 'default',
    eager: true,
  }) as FileParams;
  const result = handleFileList(langFiles);
  return result;
};

/** 获取英文翻译文件 */
export const getEnLang = () => {
  const langFiles = import.meta.glob('../en/*.ts', {
    import: 'default',
    eager: true,
  }) as FileParams;
  const result = handleFileList(langFiles);
  return result;
};

/** 获取中文翻译文件命名空间数据 */
export const getZhLangNamespaces = () => {
  const langFiles = import.meta.glob('../zh/**/*.ts', {
    import: 'default',
    eager: true,
  }) as FileParams;
  const namespace = filterNamespaceData(langFiles);
  const result = handleFileNamespaceList(namespace);
  return result;
};

/** 获取中文翻译文件命名空间数据 */
export const getEnLangNamespaces = () => {
  const langFiles = import.meta.glob('../en/**/*.ts', {
    import: 'default',
    eager: true,
  }) as FileParams;
  const namespace = filterNamespaceData(langFiles);
  const result = handleFileNamespaceList(namespace);
  return result;
};

/**
 * 处理文件转为对应格式
 * @param files - 文件集
 */
const handleFileList = (files: FileParams) => {
  const result: Record<string, unknown> = {};

  for (const key in files) {
    const data = files[key];
    const fileArr = key?.split('/');
    const fileName = fileArr?.[fileArr?.length - 1] || '';
    if (!fileName) continue;
    const name = fileName?.split('.ts')?.[0];
    if (name) result[name] = data;
  }

  return result;
};

/**
 * 过滤命名空间数据，过滤文件夹数小于2的数据
 * @param fileList - 文件列表
 */
const filterNamespaceData = (fileList: FileParams) => {
  const result: FileParams = {};

  for (const key in fileList) {
    const list = key?.split('/');
    if (list?.length > 3) {
      result[key] = fileList[key];
    }
  }

  return result;
};

/**
 * 处理文件转为对应格式
 * @param files - 文件集
 */
const handleFileNamespaceList = (files: FileParams) => {
  const result: Record<string, Record<string, unknown>> = {};

  for (const key in files) {
    const data = files[key];
    const fileArr = key?.split('/');
    // 获取命名空间
    const namespace = fileArr?.[fileArr?.length - 2] || '';
    if (!namespace) continue;
    // 获取文件名
    const fileName = fileArr?.[fileArr?.length - 1] || '';
    if (!fileName) continue;
    const name = fileName?.split('.ts')?.[0];
    if (!name) continue;

    if (!result?.[namespace]) {
      result[namespace] = {};
    }

    result[namespace][name] = data;
  }

  return result;
};
