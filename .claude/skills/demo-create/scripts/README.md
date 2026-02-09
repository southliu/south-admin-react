# CRUD 代码生成脚本

基于 Python 的 CRUD 代码生成器，可以快速生成后台管理系统的标准 CRUD 页面代码。

## 功能特性

- 自动生成 API 接口文件
- 自动生成数据模型文件（Model）
- 自动生成页面文件（Page）
- 自动生成国际化文件（中英文）
- 支持 Modal 和 Page 两种页面模式
- 自动运行 Prettier 格式化

## 使用方法

### 方式一：直接调用 Python 脚本

```bash
python3 .claude/skills/demo-create/scripts/generate.py '{
  "module_name": "Product",
  "api_path": "/product",
  "permission_prefix": "/product",
  "page_mode": "modal",
  "enable_i18n": true,
  "fields": [
    {
      "dataIndex": "name",
      "label": "产品名称",
      "component": "Input",
      "search": true,
      "table": true,
      "form": true,
      "required": true,
      "width": 200
    }
  ]
}'
```

### 方式二：使用配置文件

1. 编辑配置文件：
```bash
vi .claude/skills/demo-create/scripts/config.example.json
```

2. 生成代码：
```bash
cat .claude/skills/demo-create/scripts/config.example.json | python3 .claude/skills/demo-create/scripts/generate.py "$(cat -)"
```

## 配置说明

### 顶层配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `module_name` | string | 是 | 模块名称（PascalCase，如 Product） |
| `api_path` | string | 是 | API 路径前缀（如 /product） |
| `permission_prefix` | string | 是 | 权限前缀（如 /product） |
| `page_mode` | string | 是 | 页面模式（"modal" 或 "page"） |
| `enable_i18n` | boolean | 是 | 是否开启国际化 |
| `project_root` | string | 否 | 项目根路径（默认为当前目录） |
| `fields` | array | 是 | 字段配置数组 |

### 字段配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dataIndex` | string | 是 | 字段名 |
| `label_zh` | string | 是 | 字段中文标签 |
| `label_en` | string | 是 | 字段英文标签 |
| `component` | string | 是 | 组件类型 |
| `search` | boolean | 否 | 是否作为搜索项 |
| `table` | boolean | 否 | 是否作为表格列 |
| `form` | boolean | 否 | 是否作为表单字段 |
| `required` | boolean | 否 | 是否必填 |
| `width` | number | 否 | 表格列宽度（默认200） |

**重要**：`label_zh` 和 `label_en` 应由 AI 根据字段名智能生成合适的翻译，而不是使用硬编码的映射表。这样可以更灵活地适应各种业务场景。

### 支持的组件类型

- `Input` - 输入框
- `InputNumber` - 数字输入框
- `Select` - 下拉选择
- `DatePicker` - 日期选择
- `RangePicker` - 日期范围选择
- `TextArea` - 文本域
- `Switch` - 开关
- `Upload` - 上传

## 生成的文件

```
src/servers/{modulePath}.ts          # API 接口文件
src/pages/{modulePath}/model.ts      # 数据模型文件
src/pages/{modulePath}/index.tsx     # 页面文件
src/locales/zh/{moduleName}.ts       # 中文翻译（enableI18n=true）
src/locales/en/{moduleName}.ts       # 英文翻译（enableI18n=true）
```

## 示例

### 产品模块（基础字段）

```json
{
  "module_name": "Product",
  "api_path": "/product",
  "permission_prefix": "/product",
  "page_mode": "modal",
  "enable_i18n": true,
  "fields": [
    {
      "dataIndex": "name",
      "label_zh": "产品名称",
      "label_en": "Product Name",
      "component": "Input",
      "search": true,
      "table": true,
      "form": true,
      "required": true,
      "width": 200
    },
    {
      "dataIndex": "code",
      "label_zh": "产品编码",
      "label_en": "Product Code",
      "component": "Input",
      "search": true,
      "table": true,
      "form": true,
      "required": true,
      "width": 150
    },
    {
      "dataIndex": "price",
      "label_zh": "价格",
      "label_en": "Price",
      "component": "InputNumber",
      "search": false,
      "table": true,
      "form": true,
      "required": true,
      "width": 120
    },
    {
      "dataIndex": "stock",
      "label_zh": "库存",
      "label_en": "Stock",
      "component": "InputNumber",
      "search": false,
      "table": true,
      "form": true,
      "required": true,
      "width": 120
    },
    {
      "dataIndex": "status",
      "label_zh": "状态",
      "label_en": "Status",
      "component": "Switch",
      "search": false,
      "table": true,
      "form": true,
      "required": false,
      "width": 100
    }
  ]
}
```

### 文章模块（完整字段）

```json
{
  "module_name": "Article",
  "api_path": "/content/article",
  "permission_prefix": "/content/article",
  "page_mode": "modal",
  "enable_i18n": true,
  "fields": [
    {
      "dataIndex": "title",
      "label_zh": "标题",
      "label_en": "Title",
      "component": "Input",
      "search": true,
      "table": true,
      "form": true,
      "required": true,
      "width": 200
    },
    {
      "dataIndex": "content",
      "label_zh": "内容",
      "label_en": "Content",
      "component": "TextArea",
      "search": false,
      "table": false,
      "form": true,
      "required": false,
      "width": 200
    },
    {
      "dataIndex": "author",
      "label_zh": "作者",
      "label_en": "Author",
      "component": "Input",
      "search": false,
      "table": true,
      "form": true,
      "required": true,
      "width": 150
    },
    {
      "dataIndex": "status",
      "label_zh": "状态",
      "label_en": "Status",
      "component": "Switch",
      "search": false,
      "table": true,
      "form": true,
      "required": false,
      "width": 100
    }
  ]
}
```

## 注意事项

1. 确保 Python 3 已安装
2. 确保 npx 和 prettier 可用（用于格式化）
3. 字段名需要使用驼峰命名（camelCase）
4. 模块名需要使用帕斯卡命名（PascalCase）
5. 生成的文件会覆盖已存在的同名文件

## 依赖项

- Python 3.6+
- Node.js + npm (npx prettier)
