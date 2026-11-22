import type { InputProps, InputRef } from 'antd';
import type { SideMenu } from '#/public';
import { getMenuByKey, getOpenMenuByRouter, searchMenuValue } from '@/menus/utils/helper';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useMenuStore, useTabsStore } from '@/stores';
import { useEffect, useRef, useState } from 'react';
import { useKeyStroke } from '@/hooks/useKeyStroke';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Modal, Input } from 'antd';
import SearchResult from './SearchResult';
import SearchFooter from './SearchFooter';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function SearchModal(props: Props) {
  const { isOpen, onClose } = props;
  const { t } = useTranslation();
  const { permissions, menuList } = useCommonStore(['permissions', 'menuList']);
  const { addTabs, setActiveKey } = useTabsStore(
    useShallow((state) => ({ addTabs: state.addTabs, setActiveKey: state.setActiveKey })),
  );
  const [value, setValue] = useState(''); // 输入框值
  const [active, setActive] = useState(''); // 选中值
  const [list, setList] = useState<SideMenu[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<InputRef>(null);
  const setOpenKeys = useMenuStore((state) => state.setOpenKeys);

  // 聚焦输入框
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus({ cursor: 'end' });
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const results = searchMenuValue({ menus: menuList, permissions, value });
      setActive(results[0]?.key || '');
      setList(results);
    }, 200);
    return () => clearTimeout(timer);
  }, [isOpen, menuList, permissions, value]);

  const handleClose = () => {
    setValue('');
    setActive('');
    setList([]);
    onClose();
  };

  /**
   * 更改选中值
   * @param value - 选中值
   */
  const changActive = (value: string) => {
    setActive(value);
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
      handleClose();
    }
  };

  const onChange: InputProps['onChange'] = (event) => {
    setValue(event.target.value);
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
    if (isOpen && list.length) {
      // 监听按键
      window.addEventListener('keydown', onKeyDown);

      return () => {
        // 退出清空监听
        window.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [isOpen, list, active, onKeyDown]);

  return (
    <Modal
      className="rounded-100px"
      open={isOpen}
      closable={false}
      onCancel={handleClose}
      footer={<SearchFooter />}
    >
      <Input
        ref={inputRef}
        value={value}
        placeholder={t('public.menuSearchPlaceholder')}
        allowClear={true}
        prefix={
          <Icon
            className="text-lg text-warm-gray-400"
            icon="ant-design:search-outlined"
          />
        }
        onChange={onChange}
        onPressEnter={onPressEnter}
      />

      <SearchResult
        list={list}
        active={active}
        onCancel={handleClose}
        changActive={changActive}
      />
    </Modal>
  );
}

export default SearchModal;
