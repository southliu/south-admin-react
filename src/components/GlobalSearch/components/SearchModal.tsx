import type { SideMenu } from '#/public';
import type { InputProps, InputRef } from 'antd';
import { Ref, useImperativeHandle, useLayoutEffect } from 'react';
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { Modal, Input } from 'antd';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useKeyStroke } from '@/hooks/useKeyStroke';
import { getMenuByKey, getOpenMenuByRouter, searchMenuValue } from '@/menus/utils/helper';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useMenuStore, useTabsStore } from '@/stores';
import SearchResult from './SearchResult';
import SearchFooter from './SearchFooter';

export interface SearchModalProps {
  toggle: () => void;
}

interface Props {
  modalRef: Ref<SearchModalProps>;
}

function SearchModal(props: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<InputRef>(null);
  const { modalRef } = props;
  const { t } = useTranslation();
  const { permissions, menuList } = useCommonStore();
  const [value, setValue] = useState(''); // 输入框值
  const [active, setActive] = useState(''); // 选中值
  const [list, setList] = useState<SideMenu[]>([]);
  const [isOpen, setOpen] = useState(false);
  const setOpenKeys = useMenuStore((state) => state.setOpenKeys);
  const { addTabs, setActiveKey } = useTabsStore((state) => state);

  // 抛出外部方法
  useImperativeHandle(modalRef, () => ({
    toggle: () => {
      setOpen(!isOpen);
    },
  }));

  // 聚焦输入框
  useLayoutEffect(() => {
    if (isOpen) {
      // 防止聚焦失效
      requestAnimationFrame(() => {
        // 聚焦输入框
        inputRef.current?.focus({
          cursor: 'end',
        });
      });
    }

    // 退出时清空数据
    return () => {
      setValue('');
      setActive('');
      setList([]);
    };
  }, [isOpen]);

  /**
   * 更改选中值
   * @param value - 选中值
   */
  const changActive = (value: string) => {
    setActive(value);
  };

  /** 关闭模态框 */
  const onClose = () => {
    setOpen(false);
  };

  /** 点击回车 */
  const onPressEnter = () => {
    if (active) {
      navigate(active);
      // 添加标签
      const menuByKeyProps = { menus: menuList, permissions, key: active };
      const newTab = getMenuByKey(menuByKeyProps);
      if (newTab) addTabs(newTab);
      setActiveKey(active);
      // 处理菜单展开
      const openKeys = getOpenMenuByRouter(active);
      setOpenKeys(openKeys);
      // 关闭
      onClose();
    }
  };

  /**
   * 防抖处理搜索结果
   * @param value - 搜索值
   */
  const debounceSearch = debounce((value: string) => {
    const searchProps = { menus: menuList, permissions, value };
    const searchValue = searchMenuValue(searchProps);
    if (searchValue?.length) {
      setActive((searchValue as SideMenu[])?.[0]?.key || '');
      setList(searchValue as SideMenu[]);
    } else {
      setActive('');
      setList([]);
    }
  }, 200);

  /**
   * 防抖处理值变化值变化
   * @param event - 输入框参数
   */
  const onChange: InputProps['onChange'] = (event) => {
    const { value } = event.target;
    setValue(value);
    debounceSearch(value);
  };

  /** 键盘上事件 */
  const onArrowUp = () => {
    // 列表为空则退出
    if (!list.length) return null;
    const index = list.findIndex((item) => item.key === active);
    // 最上层则不操作
    if (index === 0) return null;
    const newActive = list[index - 1].key;
    setActive(newActive);
  };

  /** 键盘下事件 */
  const onArrowDown = () => {
    // 列表为空则退出
    if (!list.length) return null;
    const len = list.length - 1;
    const index = list.findIndex((item) => item.key === active);
    // 最下层则不操作
    if (index === len) return null;
    const newActive = list[index + 1].key;
    setActive(newActive);
  };

  // 监听按键
  const [onKeyDown] = useKeyStroke({
    ArrowUp: onArrowUp,
    ArrowDown: onArrowDown,
    Enter: onPressEnter,
  });

  // 当列表值变化时监听按键事件
  useEffect(() => {
    if (list.length) {
      // 监听按键
      window.addEventListener('keydown', onKeyDown);

      return () => {
        // 退出清空监听
        window.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [list, active, onKeyDown]);

  return (
    <Modal
      className="rounded-100px"
      open={isOpen}
      closable={false}
      onCancel={onClose}
      footer={<SearchFooter />}
    >
      <Input
        ref={inputRef}
        value={value}
        placeholder={t('public.menuSearchPlaceholder')}
        allowClear={true}
        prefix={<Icon className="text-lg text-warm-gray-400" icon="ant-design:search-outlined" />}
        onChange={onChange}
        onPressEnter={onPressEnter}
      />

      <SearchResult list={list} active={active} onCancel={onClose} changActive={changActive} />
    </Modal>
  );
}

export default SearchModal;
