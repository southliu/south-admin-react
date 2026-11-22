import type { PermissionData } from '@/servers/system/role';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import { type Key, useState, useCallback } from 'react';
import { usePublicStore } from '@/stores/public';
import { Checkbox, Spin } from 'antd';
import { Icon } from '@iconify/react';

interface Props {
  isBordered?: boolean;
  isLoading?: boolean;
  treeData: PermissionData[];
  defaultCheckedKeys?: Key[];
  onChange: (checkedKeys: Key[]) => void;
}

/**
 * 获取子节点全部key
 * @param item - 列表
 */
function getChildKeys(item?: PermissionData): Key[] {
  if (!item?.children?.length) return [];
  const result: Key[] = [];

  for (let i = 0; i < item.children.length; i++) {
    const child = item.children[i];
    if (child?.key) result.push(child.key);
    if (child?.children?.length) {
      const childKeys = getChildKeys(child);
      result.push(...childKeys);
    }
  }
  return result;
}

function MenuAuthorize(props: Props) {
  const { isBordered = true, treeData, defaultCheckedKeys, onChange, isLoading = false } = props;
  const [selection, setSelection] = useState<{ source: Key[] | undefined; keys: Key[] }>({
    source: defaultCheckedKeys,
    keys: defaultCheckedKeys?.map(String) || [],
  });
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const theme = usePublicStore((state) => state.theme);
  const checkedKeys =
    selection.source === defaultCheckedKeys
      ? selection.keys
      : defaultCheckedKeys?.map(String) || [];
  const setCheckedKeys = (keys: Key[]) => setSelection({ source: defaultCheckedKeys, keys });
  const list = treeData;

  /**
   * 更新选中状态
   * @param keys - 选中的节点标识列表，用于更新授权状态
   */
  const updateCheckedKeys = (keys: Key[]) => {
    setCheckedKeys(keys);
    onChange?.(keys);
  };

  /**
   * 获取所有节点的key
   * @param data - 权限树数据，用于收集全部节点标识
   */
  const getAllKeys = useCallback((data: PermissionData[]): Key[] => {
    const keys: Key[] = [];

    const traverse = (nodes: PermissionData[]) => {
      nodes.forEach((node) => {
        keys.push(node.key);
        if (node.children) {
          traverse(node.children);
        }
      });
    };

    traverse(data);
    return keys;
  }, []);

  /**
   * 处理节点选中/取消选中
   * @param checked - 是否选中当前节点，用于决定添加或移除权限
   * @param item - 当前权限节点，用于联动处理其子节点
   */
  const handleCheck = (checked: boolean, item: PermissionData) => {
    const { key } = item;
    const childrenKeys = getChildKeys(item);

    const newKeys = [...checkedKeys];

    if (checked) {
      // 添加选中项
      if (!newKeys.includes(key)) {
        newKeys.push(key);
      }

      // 如果是选中，需要将所有子节点也选中
      for (let i = 0; i < childrenKeys?.length; i++) {
        const child = childrenKeys[i];
        if (!newKeys.includes(child)) {
          newKeys.push(child);
        }
      }
    } else {
      // 取消选中
      for (let i = 0; i < newKeys.length; i++) {
        const newKey = newKeys[i];
        if (childrenKeys.includes(newKey) || newKey === key) {
          newKeys.splice(i, 1);
          i--;
        }
      }
    }

    updateCheckedKeys(newKeys);
  };

  /**
   * 全选/取消全选
   * @param e - 全选复选框事件，用于决定是否选中全部权限节点
   */
  const handleCheckAll = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    let newKeys: Key[] = [];

    if (checked) {
      newKeys = getAllKeys(list);
    }

    updateCheckedKeys(newKeys);
  };

  /**
   * 切换展开/收起状态
   * @param key - 目标标签或菜单的标识
   */
  const toggleExpand = useCallback((key: Key) => {
    setExpandedKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  }, []);

  /**
   * 获取所有可展开的节点key
   * @param data - 权限树数据，用于收集含子节点的可展开项
   */
  const getAllExpandableKeys = useCallback((data: PermissionData[]): Key[] => {
    const keys: Key[] = [];

    const traverse = (nodes: PermissionData[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          keys.push(node.key);
          traverse(node.children);
        }
      });
    };

    traverse(data);
    return keys;
  }, []);

  /** 展开/收起所有节点 */
  const toggleExpandAll = useCallback(() => {
    const allExpandableKeys = getAllExpandableKeys(list);
    if (expandedKeys.length === allExpandableKeys.length) {
      // 如果所有可展开节点都已展开，则收起所有节点
      setExpandedKeys([]);
    } else {
      // 否则展开所有有子节点的节点
      setExpandedKeys(allExpandableKeys);
    }
  }, [expandedKeys.length, list, getAllExpandableKeys]);

  /**
   * 渲染树节点
   * @param list - 当前层级的权限节点，用于渲染授权树
   * @param step - 当前树节点层级，用于计算缩进距离
   */
  const renderTreeNode = (list: PermissionData[], step = 0) => {
    if (!list?.length) return null;
    const isAuthorizeBtn = list.every((item) => item.type === 3);

    return (
      <div
        className={isAuthorizeBtn ? 'inline-block' : 'block'}
        style={{ marginLeft: isAuthorizeBtn ? (step + 1) * 20 : 0 }}
      >
        {list.map((item) => {
          let isChecked = checkedKeys.includes(item.key);
          const isExpanded = expandedKeys.includes(item.key);
          const childrenKeys = getChildKeys(item);
          const isEmptyChildrenKeys = !childrenKeys?.some((child) => checkedKeys.includes(child));
          const isAllCheckedChildrenKeys = childrenKeys?.every((child) =>
            checkedKeys.includes(child),
          );
          const isIndeterminate =
            item?.children?.length && !isEmptyChildrenKeys ? !isAllCheckedChildrenKeys : undefined;
          const hasChildren = item.children && item.children.length > 0;
          let marginLeft = step * 20;
          const isAuthorizeBtn = item.type === 3;

          // 如果有子节点，判断子数据是否为空
          if (hasChildren) {
            if (isChecked && isEmptyChildrenKeys) {
              isChecked = false;
              handleCheck(false, item);
            }
            if (!isChecked && isAllCheckedChildrenKeys) {
              isChecked = true;
              handleCheck(true, item);
            }
          }

          // 如果是权限按钮，则左间距调整
          if (item.type === 3) {
            marginLeft = 10;
          }

          return (
            <div key={item.key} className={item.type === 3 ? 'inline-block' : 'block'}>
              <div className="flex items-center" style={{ marginLeft: marginLeft }}>
                {hasChildren ? (
                  <div
                    className="text-12px inline-block cursor-pointer p-5px"
                    onClick={() => toggleExpand(item.key)}
                  >
                    {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                  </div>
                ) : (
                  <div className={!isAuthorizeBtn ? 'w-24px h-24px' : ''}></div> // 占位符，保持对齐
                )}
                <Checkbox
                  checked={isChecked}
                  indeterminate={isIndeterminate}
                  onChange={(e) => handleCheck(e.target.checked, item)}
                  className="w-full"
                >
                  <div className="flex items-center gap-5px">
                    {item?.icon && typeof item.icon === 'string' && (
                      <Icon icon={item.icon} className="text-16px" />
                    )}
                    <div className="flex-1">{item.title as string}</div>
                  </div>
                </Checkbox>
              </div>
              {hasChildren && isExpanded && renderTreeNode(item.children || [], step + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  // 计算是否全选
  const allKeys = getAllKeys(list);
  const isAllChecked =
    checkedKeys.length > 0 && allKeys.every((item) => checkedKeys.includes(item));
  const hasCheckedKeys = checkedKeys.length > 0;

  return (
    <Spin spinning={isLoading}>
      <div
        className={isBordered ? `b ${theme === 'dark' ? 'b-#454545' : 'b-#E4E4E7'} b-rd-8px` : ''}
      >
        <div className="p-10px">
          <div className="flex items-center justify-between mb-10px">
            <Checkbox
              checked={isAllChecked}
              indeterminate={!isAllChecked && hasCheckedKeys}
              onChange={handleCheckAll}
            >
              全选
            </Checkbox>
            <div className="text-blue-500 cursor-pointer text-12px" onClick={toggleExpandAll}>
              {expandedKeys.length === getAllExpandableKeys(list).length ? '收起所有' : '展开所有'}
            </div>
          </div>
          {renderTreeNode(list)}
        </div>
      </div>
    </Spin>
  );
}

export default MenuAuthorize;
