import { getMenuPage } from '@/servers/system/menu';
import { Icon } from '@iconify/react';
import { Spin, Tree, type TreeProps, type SelectProps } from 'antd';

function AuthorizeSelect(props: SelectProps) {
  const { value, onChange } = props;
  const [list, setList] = useState<BaseFormData[]>([]);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    getList();
  }, []);

  /** 处理数据，将icon转为组件 */
  const handleItems = (items: BaseFormData[]) => {
    if (!items?.length) return [];

    const deep = (data: BaseFormData[]) => {
      return data.map((item: BaseFormData & { children?: BaseFormData[] }) => {
        if (item.icon && typeof item.icon === 'string') {
          item.icon = <Icon icon={item.icon} className="text-16px" />;
        }
        if (item.children?.length) {
          item.children = deep(item.children);
        }
        return item;
      });
    };

    return deep(items);
  };

  /** 获取数据 */
  const getList = async () => {
    const params = { page: 1, pageSize: 1000 };

    try {
      setLoading(true);
      const res = await getMenuPage(params);
      const { code, data } = res;
      if (Number(code) !== 200) return;
      const { items } = data;
      setList(handleItems(items));
    } finally {
      setLoading(false);
    }
  };

  /** 点击复选框 */
  const onCheck: TreeProps['onCheck'] = (checkedKeys) => {
    onChange?.(checkedKeys);
  };

  return (
    <Spin spinning={isLoading}>
      <Tree
        checkable
        showIcon
        checkedKeys={value || []}
        treeData={list as unknown as TreeProps['treeData']}
        fieldNames={{ key: 'id', title: 'label' }}
        onCheck={onCheck}
      />
    </Spin>
  );
}

export default AuthorizeSelect;
