#!/usr/bin/env python3
"""
CRUD 代码生成脚本
根据配置参数生成后台管理系统的标准 CRUD 页面代码
"""

import os
import sys
import subprocess
from pathlib import Path
from typing import Dict, List, Any


class FieldConfig:
    """字段配置类"""
    def __init__(self, data_index: str, label_zh: str, label_en: str, component: str,
                 search: bool = False, table: bool = False, form: bool = False,
                 required: bool = False, width: int = 200):
        self.data_index = data_index
        self.label_zh = label_zh
        self.label_en = label_en
        self.component = component
        self.search = search
        self.table = table
        self.form = form
        self.required = required
        self.width = width


class CodeGenerator:
    """代码生成器"""

    def __init__(self, config: Dict[str, Any]):
        self.module_name = config['module_name']  # Product
        self.api_path = config['api_path']  # /product
        self.permission_prefix = config['permission_prefix']  # /product
        self.page_mode = config['page_mode']  # modal or page
        self.enable_i18n = config['enable_i18n']  # true or false
        self.fields = config['fields']  # List of field configs
        self.project_root = Path(config.get('project_root', os.getcwd()))

        # 从 module_name 获取 module_path (Product -> product)
        self.module_path = self.module_name[0].lower() + self.module_name[1:]

    def generate_api_file(self) -> str:
        """生成 API 文件内容"""
        module_name = self.module_name
        module_path = self.module_path
        api_path = self.api_path

        content = f"""import {{ request }} from '@/utils/request';

enum API {{
  URL = '{api_path}',
}}

/**
 * 获取分页数据
 * @param data - 请求数据
 */
export function get{module_name}Page(data: Partial<BaseFormData> & PaginationData) {{
  return request.get<PageServerResult<BaseFormData[]>>(`${{API.URL}}/page`, {{ params: data }});
}}

/**
 * 根据ID获取数据
 * @param id - ID
 */
export function get{module_name}ById(id: string) {{
  return request.get<BaseFormData>(`${{API.URL}}/detail?id=${{id}}`);
}}

/**
 * 新增数据
 * @param data - 请求数据
 */
export function create{module_name}(data: BaseFormData) {{
  return request.post(`${{API.URL}}/create`, data);
}}

/**
 * 修改数据
 * @param id - 修改id值
 * @param data - 请求数据
 */
export function update{module_name}(id: string, data: BaseFormData) {{
  return request.put(`${{API.URL}}/update/${{id}}`, data);
}}

/**
 * 删除
 * @param id - 删除id值
 */
export function delete{module_name}(id: string) {{
  return request.delete(`${{API.URL}}/${{id}}`);
}}

/**
 * 批量删除
 * @param data - 请求数据
 */
export function batchDelete{module_name}(data: BaseFormData) {{
  return request.post(`${{API.URL}}/batchDelete`, data);
}}
"""
        return content

    def generate_model_file(self) -> str:
        """生成 Model 文件内容"""
        module_path = self.module_path

        # 生成 searchList
        search_fields = [f for f in self.fields if f.search]
        search_list_items = []
        for field in search_fields:
            if self.enable_i18n:
                label = f"t('{module_path}.{field.data_index}')"
            else:
                label = f"'{field.label_zh}'"
            search_list_items.append(f"""  {{
    label: {label},
    name: '{field.data_index}',
    wrapperWidth: 200,
    component: '{field.component}',
  }}""")

        # 生成 tableColumns
        table_fields = [f for f in self.fields if f.table]
        column_items = [
            """    {
      title: 'ID',
      dataIndex: 'id',
      width: 200,
    }"""
        ]

        for field in table_fields:
            if self.enable_i18n:
                title = f"t('{module_path}.{field.data_index}')"
            else:
                title = f"'{field.label_zh}'"
            column_items.append(f"""    {{
      title: {title},
      dataIndex: '{field.data_index}',
      width: {field.width},
    }}""")

        # 添加时间列
        creation_time = "t('public.creationTime')" if self.enable_i18n else "'创建时间'"
        update_time = "t('public.updateTime')" if self.enable_i18n else "'更新时间'"
        operate = "t('public.operate')" if self.enable_i18n else "'操作'"

        column_items.extend([
            f"""    {{
      title: {creation_time},
      dataIndex: 'createdAt',
      width: 200,
    }}""",
            f"""    {{
      title: {update_time},
      dataIndex: 'updatedAt',
      width: 200,
    }}""",
            f"""    {{
      title: {operate},
      dataIndex: 'operate',
      width: 200,
      fixed: 'right',
      render: (value: unknown, record: object) => optionRender(value, record),
    }}"""
        ])

        # 生成 createList
        form_fields = [f for f in self.fields if f.form]
        create_list_items = []
        for field in form_fields:
            if self.enable_i18n:
                label = f"t('{module_path}.{field.data_index}')"
            else:
                label = f"'{field.label_zh}'"
            rules = "FORM_REQUIRED" if field.required else "undefined"
            create_list_items.append(f"""  {{
    label: {label},
    name: '{field.data_index}',
    rules: {rules},
    component: '{field.component}',
  }}""")

        content = f"""import type {{ TFunction }} from 'i18next';

// 搜索数据
export const searchList = (t: TFunction): BaseSearchList[] => [
{',\n'.join(search_list_items)}
];

/**
 * 表格数据
 * @param optionRender - 渲染操作函数
 */
export const tableColumns = (t: TFunction, optionRender: TableOptions<object>): TableColumn[] => {{
  return [
{',\n'.join(column_items)}
  ];
}};

// 新增数据
export const createList = (t: TFunction): BaseFormList[] => [
{',\n'.join(create_list_items)}
];
"""
        return content

    def generate_page_file(self) -> str:
        """生成 Page 文件内容"""
        module_name = self.module_name
        module_path = self.module_path
        permission_prefix = self.permission_prefix

        # 判断是否有 status 字段，设置 initCreate
        has_status = any(f.data_index == 'status' for f in self.fields)
        init_create = "  status: 1," if has_status else ""

        import_lines = """import {{
  get{MODULE_NAME}Page,
  get{MODULE_NAME}ById,
  create{MODULE_NAME},
  update{MODULE_NAME},
  delete{MODULE_NAME},
}} from '@/servers/{MODULE_PATH}';""".format(MODULE_NAME=module_name, MODULE_PATH=module_path)

        content = """import type {{ BaseFormData }} from '#/form';
import type {{ PagePermission }} from '#/public';
import {{ useEffectOnActive }} from 'keepalive-for-react';
import {{ type FormInstance, Form, message }} from 'antd';
import {{ searchList, createList, tableColumns }} from './model';
{IMPORT_LINES}

// 当前行数据
interface RowData {{
  id: string;
  name: string;
}}

// 初始化新增数据
const initCreate = {{
{INIT_CREATE}
}};

function Page() {{
  const {{ t }} = useTranslation();
  const createFormRef = useRef<FormInstance>(null);
  const columns = tableColumns(t, optionRender);
  const [isFetch, setFetch] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isCreateLoading, setCreateLoading] = useState(false);
  const [createTitle, setCreateTitle] = useState(ADD_TITLE(t));
  const [createId, setCreateId] = useState('');
  const [createData, setCreateData] = useState<BaseFormData>(initCreate);
  const [searchData, setSearchData] = useState<BaseFormData>({{}});
  const [page, setPage] = useState(INIT_PAGINATION.page);
  const [pageSize, setPageSize] = useState(INIT_PAGINATION.pageSize);
  const [total, setTotal] = useState(0);
  const [tableData, setTableData] = useState<BaseFormData[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const {{ permissions }} = useCommonStore();

  // 权限前缀
  const permissionPrefix = '{PERMISSION_PREFIX}';

  // 权限
  const pagePermission: PagePermission = {{
    page: checkPermission(permissionPrefix, permissions),
    create: checkPermission(`${{permissionPrefix}}/create`, permissions),
    update: checkPermission(`${{permissionPrefix}}/update`, permissions),
    delete: checkPermission(`${{permissionPrefix}}/delete`, permissions),
  }};

  /** 获取表格数据 */
  const getPage = useCallback(async () => {{
    const params = {{ ...searchData, page, pageSize }};

    try {{
      setLoading(true);
      const res = await get{MODULE_NAME}Page(params);
      const {{ code, data }} = res;
      if (Number(code) !== 200) return;
      const {{ items, total }} = data;
      setTotal(total || 0);
      setTableData(items || []);
    }} finally {{
      setFetch(false);
      setLoading(false);
    }}
  }}, [page, pageSize, searchData]);

  useEffect(() => {{
    if (isFetch) getPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }}, [isFetch]);

  // 首次进入自动加载接口数据
  useEffect(() => {{
    if (pagePermission.page) getPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }}, [pagePermission.page]);

  // 每次进入调用
  useEffectOnActive(() => {{
    getPage();
  }}, [], true);

  /**
   * 点击搜索
   * @param values - 表单返回数据
   */
  const onSearch = (values: BaseFormData) => {{
    setPage(1);
    setSearchData(values);
    setFetch(true);
  }};

  /** 点击新增 */
  const onCreate = () => {{
    setCreateOpen(true);
    setCreateTitle(ADD_TITLE(t));
    setCreateId('');
    setCreateData(initCreate);
  }};

  /**
   * 点击编辑
   * @param id - 唯一值
   */
  const onUpdate = async (id: string) => {{
    try {{
      setCreateOpen(true);
      setCreateTitle(EDIT_TITLE(t, id));
      setCreateId(id);
      setCreateLoading(true);
      const {{ code, data }} = await get{MODULE_NAME}ById(id);
      if (Number(code) !== 200) return;
      setCreateData(data);
    }} finally {{
      setCreateLoading(false);
    }}
  }};

  /** 表单提交 */
  const createSubmit = () => {{
    createFormRef?.current?.submit();
  }};

  /** 关闭新增/修改弹窗 */
  const closeCreate = () => {{
    setCreateOpen(false);
  }};

  /**
   * 新增/编辑提交
   * @param values - 表单返回数据
   */
  const handleCreate = async (values: BaseFormData) => {{
    try {{
      setCreateLoading(true);
      const functions = () => (createId ? update{MODULE_NAME}(createId, values) : create{MODULE_NAME}(values));
      const {{ code, message }} = await functions();
      if (Number(code) !== 200) return;
      messageApi.success(message || t('public.successfulOperation'));
      setCreateOpen(false);
      getPage();
    }} finally {{
      setCreateLoading(false);
    }}
  }};

  /**
   * 点击删除
   * @param id - 唯一值
   */
  const onDelete = async (id: string) => {{
    try {{
      setLoading(true);
      const {{ code, message }} = await delete{MODULE_NAME}(id);
      if (Number(code) === 200) {{
        messageApi.success(message || t('public.successfullyDeleted'));
        getPage();
      }}
    }} finally {{
      setLoading(false);
    }}
  }};

  /**
   * 处理分页
   * @param page - 当前页数
   * @param pageSize - 每页条数
   */
  const onChangePagination = useCallback((page: number, pageSize: number) => {{
    setPage(page);
    setPageSize(pageSize);
    setFetch(true);
  }}, []);

  /**
   * 渲染操作
   * @param _ - 当前值
   * @param record - 当前行参数
   */
  function optionRender(_: unknown, record: object) {{
    return (
      <div className="flex flex-wrap gap-5px">
        {{pagePermission.update === true && (
          <UpdateBtn onClick={{() => onUpdate((record as RowData).id)}} />
        )}}
        {{pagePermission.delete === true && (
          <DeleteBtn
            name={{(record as RowData).name}}
            handleDelete={{() => onDelete((record as RowData).id)}}
          />
        )}}
      </div>
    );
  }}

  return (
    <BaseContent isPermission={{pagePermission.page}}>
      {{contextHolder}}
      <BaseCard>
        <BaseSearch
          list={{searchList(t)}}
          data={{searchData}}
          isLoading={{isLoading}}
          handleFinish={{onSearch}}
        />
      </BaseCard>

      <BaseCard className="mt-10px">
        <BaseTable
          isLoading={{isLoading}}
          isCreate={{pagePermission.create}}
          columns={{columns}}
          dataSource={{tableData}}
          getPage={{getPage}}
          onCreate={{onCreate}}
        />

        <BasePagination
          disabled={{isLoading}}
          current={{page}}
          pageSize={{pageSize}}
          total={{total}}
          onChange={{onChangePagination}}
        />
      </BaseCard>

      <BaseModal
        width={{600}}
        title={{createTitle}}
        open={{isCreateOpen}}
        confirmLoading={{isCreateLoading}}
        onOk={{createSubmit}}
        onCancel={{closeCreate}}
      >
        <BaseForm
          form={{form}}
          ref={{createFormRef}}
          list={{createList(t)}}
          data={{createData}}
          labelCol={{{{ 'span': 4 }}}}
          wrapperCol={{{{ 'span': 19 }}}}
          handleFinish={{handleCreate}}
        />
      </BaseModal>
    </BaseContent>
  );
}}

export default Page;
""".format(
            IMPORT_LINES=import_lines,
            INIT_CREATE=init_create,
            PERMISSION_PREFIX=permission_prefix,
            MODULE_NAME=module_name
        )
        return content

    def generate_i18n_files(self):
        """生成国际化文件内容"""
        # 中文
        zh_content = "export default {\n"
        for field in self.fields:
            zh_content += f"  {field.data_index}: '{field.label_zh}',\n"
        zh_content += "};\n"

        # 英文
        en_content = "export default {\n"
        for field in self.fields:
            en_content += f"  {field.data_index}: '{field.label_en}',\n"
        en_content += "};\n"

        return zh_content, en_content

    def write_files(self):
        """写入所有生成的文件"""
        base_path = self.project_root

        # 文件路径
        api_file = base_path / f"src/servers/{self.module_path}.ts"
        model_file = base_path / f"src/pages/{self.module_path}/model.ts"
        page_file = base_path / f"src/pages/{self.module_path}/index.tsx"
        zh_i18n_file = base_path / f"src/locales/zh/{self.module_path}.ts"
        en_i18n_file = base_path / f"src/locales/en/{self.module_path}.ts"

        # 创建目录
        (base_path / f"src/pages/{self.module_path}").mkdir(parents=True, exist_ok=True)

        # 生成并写入文件
        print(f"📁 生成 API 文件: {api_file.relative_to(base_path)}")
        api_file.write_text(self.generate_api_file(), encoding='utf-8')

        print(f"📁 生成 Model 文件: {model_file.relative_to(base_path)}")
        model_file.write_text(self.generate_model_file(), encoding='utf-8')

        print(f"📁 生成 Page 文件: {page_file.relative_to(base_path)}")
        page_file.write_text(self.generate_page_file(), encoding='utf-8')

        if self.enable_i18n:
            print(f"📁 生成中文国际化文件: {zh_i18n_file.relative_to(base_path)}")
            zh_i18n_file.parent.mkdir(parents=True, exist_ok=True)
            zh_content, en_content = self.generate_i18n_files()
            zh_i18n_file.write_text(zh_content, encoding='utf-8')

            print(f"📁 生成英文国际化文件: {en_i18n_file.relative_to(base_path)}")
            en_i18n_file.parent.mkdir(parents=True, exist_ok=True)
            en_i18n_file.write_text(en_content, encoding='utf-8')

        # 运行 prettier 格式化
        print("\n🎨 运行 prettier 格式化...")
        files_to_format = [
            str(api_file),
            str(model_file),
            str(page_file),
        ]
        if self.enable_i18n:
            files_to_format.extend([str(zh_i18n_file), str(en_i18n_file)])

        try:
            subprocess.run(
                ['npx', 'prettier', '--write'] + files_to_format,
                cwd=base_path,
                capture_output=True,
                text=True
            )
            print("✅ 格式化完成")
        except Exception as e:
            print(f"⚠️  格式化失败: {e}")

        print("\n✅ 所有文件生成完成！")


def parse_field_config(field_data: Dict) -> FieldConfig:
    """解析字段配置"""
    return FieldConfig(
        data_index=field_data['dataIndex'],
        label_zh=field_data['label_zh'],
        label_en=field_data['label_en'],
        component=field_data['component'],
        search=field_data.get('search', False),
        table=field_data.get('table', False),
        form=field_data.get('form', False),
        required=field_data.get('required', False),
        width=field_data.get('width', 200)
    )


if __name__ == '__main__':
    # 从命令行参数读取配置（JSON 格式）
    if len(sys.argv) < 2:
        print("Usage: python generate.py '<config_json>'")
        sys.exit(1)

    import json

    try:
        config_json = sys.argv[1]
        config = json.loads(config_json)

        # 解析字段配置
        fields = [parse_field_config(f) for f in config.get('fields', [])]
        config['fields'] = fields

        # 生成代码
        generator = CodeGenerator(config)
        generator.write_files()

    except json.JSONDecodeError as e:
        print(f"❌ JSON 解析错误: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 生成失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
