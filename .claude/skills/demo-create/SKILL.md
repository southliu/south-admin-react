---
name: demo-create
description: 基于项目中 .vscode/south.code-snippets 定义的 CRUD 模板，快速生成后台管理系统的标准 CRUD 页面代码。该技能根据用户提供的业务模块信息（如模块名称、API路径、字段配置等），自动生成完整的页面文件（Page）、数据模型文件（Model）和 API 接口文件（Api），支持分页列表页面（demoPage）、独立操作页面（demoOptionPage）两种页面模式。
---

# demo-create

## Description
基于项目中 `.vscode/south.code-snippets` 定义的 CRUD 模板，快速生成后台管理系统的标准 CRUD 页面代码。根据用户提供的业务模块信息（模块名称、API路径、字段配置等），自动生成完整的页面文件（Page）、数据模型文件（Model）和 API 接口文件（Api），支持弹窗模式（demoPage）和独立页面模式（demoOptionPage）两种。

## Instructions

### 1. 收集必要信息

在生成代码前，向用户确认以下信息（未提供则主动询问，一个一个询问）：

- **moduleName**：模块名称（英文 PascalCase），如 `User`、`Article`
- **apiPath**：API 路径前缀，如 `/system/user`
- **permissionPrefix**：权限前缀路径，如 `/system/user`
- **pageMode**：`modal`（弹窗模式）或 `page`（独立页面模式）
- **enableI18n**：是否开启国际化（`true`/`false`），开启时使用 `t()` 函数包裹标签文本
- **fatherPath**：父路径（仅 page 模式），如 `/system/user`
- **zhTitle / enTitle**：中英文标题（仅 page 模式），如 `用户` / `User`
- **fields**：业务字段列表，每个字段包含：
  - `dataIndex`（字段名）
  - `label`（标签）
  - `component`（组件类型：`Input`/`InputNumber`/`Select`/`DatePicker`/`RangePicker`/`TextArea`/`Switch`/`Upload`）
  - `search`（是否搜索项）
  - `table`（是否表格列）
  - `form`（是否表单字段）
  - `required`（是否必填）
  - `width`（表格列宽度，默认200）

### 2. 生成文件结构

#### Modal 模式
```
src/pages/{modulePath}/
├── index.tsx # 主页面（demoPage 模板）
└── model.ts # 数据模型（demoModel 模板）
src/servers/{modulePath}.ts # API 接口（demoApi 模板）
```

#### Page 模式
```
src/pages/{modulePath}/
├── index.tsx # 列表页（demoPage 模板，新增/编辑改为路由跳转）
├── model.ts # 数据模型（demoModel 模板）
└── option.tsx # 操作页（demoOptionPage 模板）
src/servers/{modulePath}.ts # API 接口（demoApi 模板）
```


### 3. 代码生成规则

#### 3.1 通用替换规则

所有模板中进行以下替换：
- `getXXXPage` → `get{ModuleName}Page`
- `getXXXById` → `get{ModuleName}ById`
- `createXXX` → `create{ModuleName}`
- `updateXXX` → `update{ModuleName}`
- `deleteXXX` → `delete{ModuleName}`
- `batchDeleteXXX` → `batchDelete{ModuleName}`
- `API.URL = '/xxx'` → 实际 `apiPath`
- `@/servers/xxx` → `@/servers/{实际模块路径}`
- `permissionPrefix = '/xxx'` → 实际权限前缀
- `fatherPath = '/xxx'` → 实际父路径（page 模式）

#### 3.2 API 文件（基于 south.code-snippets 中 demoApi 模板）

参照 `.vscode/south.code-snippets` 中 `demoApi` 的 `body` 内容生成，替换所有 `XXX`/`xxx` 为对应模块名称和路径。保持所有函数签名、类型定义和注释不变。

#### 3.3 Model 文件（基于 south.code-snippets 中 demoModel 模板）

参照 `.vscode/south.code-snippets` 中 `demoModel` 的 `body` 内容生成：
- **searchList**：仅包含 `search: true` 的字段，`wrapperWidth` 默认 200
  - `enableI18n = true`：label 使用 `t('moduleName.fieldName')` 格式
  - `enableI18n = false`：label 使用中文字符串
- **tableColumns**：仅包含 `table: true` 的字段，始终保留 `operate` 操作列，`width` 默认 200
  - `enableI18n = true`：title 使用 `t('moduleName.fieldName')` 格式，保留 `createdAt`/`updatedAt` 使用 `t('public.creationTime')`/`t('public.updateTime')`
  - `enableI18n = false`：title 使用中文字符串
- **createList**：仅包含 `form: true` 的字段，必填字段添加 `rules: FORM_REQUIRED`
  - `enableI18n = true`：label 使用 `t('moduleName.fieldName')` 格式
  - `enableI18n = false`：label 使用中文字符串

#### 3.4 Page 文件（基于 south.code-snippets 中 demoPage 模板）

参照 `.vscode/south.code-snippets` 中 `demoPage` 的 `body` 内容生成：
- **RowData 接口**：根据用户字段生成，始终包含 `id: string`
- **initCreate**：设置合理的默认值（如 `status: 1`）
- 替换 import 中的 API 函数名和路径
- 替换 `permissionPrefix`

#### 3.5 Option 文件（仅 page 模式，基于 south.code-snippets 中 demoOptionPage 模板）

参照 `.vscode/south.code-snippets` 中 `demoOptionPage` 的 `body` 内容生成：
- 替换 `fatherPath`、`zhTitle`、`enTitle`
- 替换 `useSingleTab` 中的标题
- 替换 `permissionPrefix`

### 4. 国际化处理

根据 `enableI18n` 参数决定如何处理标签文本：
- **开启国际化（enableI18n = true）**：所有标签使用 `t()` 函数包裹，如 `t('public.name')`、`t('product.code')`
- **关闭国际化（enableI18n = false）**：所有标签使用中文字符串，如 `'产品编码'`、`'产品名称'`

### 5. 文件生成要求

**重要**：执行完代码生成后，必须使用 Write 工具将生成的代码写入实际文件，而不仅仅是输出代码块。

生成文件时：
1. 使用 Write 工具创建/覆盖文件
2. 如果目录不存在，使用 Bash 工具先创建目录
3. 按照输出顺序依次生成所有文件
4. **运行 prettier 格式化所有生成的文件**：
   ```bash
   npx prettier --write src/servers/{modulePath}.ts src/pages/{modulePath}/index.tsx src/pages/{modulePath}/model.ts src/locales/zh/{moduleName}.ts src/locales/en/{moduleName}.ts
   ```
5. 生成完成后告知用户文件已创建的路径

### 6. 注意事项

- 不修改模板中已有的工具函数、hooks、组件使用方式
- 保持代码风格与模板一致（缩进、空行、注释）
- 所有类型引用保持与模板一致：`BaseFormData`、`PagePermission`、`BaseSearchList`、`TableColumn`、`TableOptions`、`PaginationData`、`PageServerResult`
- 保留所有工具函数引用：`checkPermission`、`useCommonStore`、`usePublicStore`、`useTabsStore`、`INIT_PAGINATION`、`ADD_TITLE`、`EDIT_TITLE`、`FORM_REQUIRED`、`useSingleTab`、`useEffectOnActive`、`useTranslation`、`useLocation`
- 生成的代码应可直接使用，无需额外修改

### 7. 国际化文件生成（仅当 enableI18n = true 时）

当开启国际化时，额外生成以下文件：

#### 7.1 中文国际化文件
**文件路径**：`src/locales/zh/{moduleName}.ts`

根据字段配置生成翻译对象，格式：
```typescript
export default {
  fieldName1: '中文名称1',
  fieldName2: '中文名称2',
  // ...
};
```

**字段翻译映射**：
- `name` → `产品名称`
- `code` → `产品编码`
- `price` → `价格`
- `stock` → `库存`
- `category` → `分类`
- `brand` → `品牌`
- `status` → `状态`
- `description` → `描述`
- `images` → `图片`
- `title` → `标题`
- `content` → `内容`
- `remark` → `备注`

#### 7.2 英文国际化文件
**文件路径**：`src/locales/en/{moduleName}.ts`

格式同中文文件，使用英文翻译：
```typescript
export default {
  fieldName1: 'Field Name 1',
  fieldName2: 'Field Name 2',
  // ...
};
```

**字段翻译映射**：
- `name` → `Name`
- `code` → `Code`
- `price` → `Price`
- `stock` → `Stock`
- `category` → `Category`
- `brand` → `Brand`
- `status` → `Status`
- `description` → `Description`
- `images` → `Images`
- `title` → `Title`
- `content` → `Content`
- `remark` → `Remark`

**注意**：如果字段不在映射表中，保持原字段名作为翻译。

### 8. 输出顺序

1. API 文件（`src/servers/{modulePath}.ts`）
2. Model 文件（`src/pages/{modulePath}/model.ts`）
3. Page 文件（`src/pages/{modulePath}/index.tsx`）
4. Option 文件（仅 page 模式，`src/pages/{modulePath}/option.tsx`）
5. 中文国际化文件（仅 enableI18n = true，`src/locales/zh/{moduleName}.ts`）
6. 英文国际化文件（仅 enableI18n = true，`src/locales/en/{moduleName}.ts`）
