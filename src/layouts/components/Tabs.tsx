import type { TabsProps } from 'antd';
import type { KeepAliveRef } from 'keepalive-for-react';
import {
  type DragEndEvent,
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
} from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import DraggableTabNode, { type DraggableTabPaneProps } from './DraggableTabNode';
import { useCallback, useEffect, useMemo, useState, memo, useRef, type RefObject } from 'react';
import { getMenuByKey } from '@/menus/utils/helper';
import { message, Tabs, Dropdown } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDropdownMenu } from '../hooks/useDropdownMenu';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useTabsStore, usePublicStore } from '@/stores';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { getTabTitle } from '../utils/helper';
import { setTitle } from '@/utils/helper';
import styles from '../index.module.less';
import TabRefresh from './TabRefresh';
import TabMaximize from './TabMaximize';
import TabOptions from './TabOptions';

interface LayoutTabsProps {
  aliveRef: RefObject<KeepAliveRef | null>;
}

function LayoutTabs({ aliveRef }: LayoutTabsProps) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // 使用 useMemo 缓存传感器配置，避免每次渲染重新创建
  const sensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 20, // 增加激活距离，减少误触
      tolerance: 10, // 增加容差
    },
  });

  const [messageApi, contextHolder] = message.useMessage();
  const [refreshTime, setRefreshTime] = useState<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const isNavigatingRef = useRef(false);

  const setRefresh = usePublicStore((state) => state.setRefresh);

  // 使用 useShallow 优化 Zustand 订阅
  const {
    tabs,
    isCloseTabsLock,
    activeKey,
    setActiveKey,
    addTabs,
    sortTabs,
    closeTabs,
    setNav,
    toggleCloseTabsLock,
    switchTabsLang,
  } = useTabsStore(
    useShallow((state) => ({
      tabs: state.tabs,
      isCloseTabsLock: state.isCloseTabsLock,
      activeKey: state.activeKey,
      setActiveKey: state.setActiveKey,
      addTabs: state.addTabs,
      sortTabs: state.sortTabs,
      closeTabs: state.closeTabs,
      setNav: state.setNav,
      toggleCloseTabsLock: state.toggleCloseTabsLock,
      switchTabsLang: state.switchTabsLang,
    })),
  );

  const { permissions, isMaximize, menuList } = useCommonStore();

  // 使用 Map 缓存 URL 参数查询，避免每次都遍历
  const urlParamsMap = useMemo(
    () => new Map(tabs.map((tab) => [tab.key, tab.urlParams || ''])),
    [tabs],
  );

  /**
   * 添加标签
   */
  const handleAddTab = useCallback(
    (path = pathname) => {
      if (!permissions.length || path === '/') return;

      const menuByKeyProps = { menus: menuList, permissions, key: path };
      const newItems = getMenuByKey(menuByKeyProps);

      if (newItems?.key) {
        setActiveKey(newItems.key);
        setNav(newItems.nav);
        addTabs(newItems);
      } else {
        setActiveKey(path);
      }
    },
    [permissions, menuList, pathname, setActiveKey, setNav, addTabs],
  );

  // 初始化标签 - 只执行一次
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;
    if (permissions.length > 0 && menuList.length > 0) {
      handleAddTab();
      hasInitialized.current = true;
    }
  }, [permissions, menuList, handleAddTab]);

  // 监听 pathname 变化
  useEffect(() => {
    if (!hasInitialized.current || !pathname) return;

    // 防止导航中的重复调用
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    handleAddTab(pathname);
  }, [pathname, handleAddTab]);

  // 同步 activeKey 和 pathname
  useEffect(() => {
    if (activeKey === pathname) return;

    const key = isCloseTabsLock ? activeKey : pathname;

    if (isCloseTabsLock) {
      toggleCloseTabsLock(false);
      const menuByKeyProps = { menus: menuList, permissions, key };
      const newItems = getMenuByKey(menuByKeyProps);
      if (newItems?.nav) {
        setNav(newItems.nav);
      }
      // 直接导航
      const urlParams = urlParamsMap.get(key) || '';
      navigate(`${key}${urlParams}`);
    } else {
      handleAddTab(key);
    }
  }, [
    activeKey,
    pathname,
    isCloseTabsLock,
    menuList,
    permissions,
    urlParamsMap,
    navigate,
    toggleCloseTabsLock,
    setNav,
    handleAddTab,
  ]);

  // 设置浏览器标题
  useEffect(() => {
    const title = getTabTitle(tabs, pathname);
    if (title) setTitle(t, title);
  }, [tabs, pathname, t]);

  // 语言切换
  useEffect(() => {
    switchTabsLang(i18n.language);
  }, [i18n.language, switchTabsLang]);

  /**
   * 路由跳转 - 直接导航
   */
  const handleNavigateTo = useCallback(
    (key: string) => {
      isNavigatingRef.current = true;
      const urlParams = urlParamsMap.get(key) || '';
      navigate(`${key}${urlParams}`);
    },
    [urlParamsMap, navigate],
  );

  /**
   * Tab 切换
   */
  const onChange = useCallback(
    (key: string) => {
      handleNavigateTo(key);
    },
    [handleNavigateTo],
  );

  /**
   * 删除标签
   * @param targetKey - 目标key值
   */
  const remove = useCallback(
    (targetKey: string) => {
      closeTabs(targetKey, aliveRef.current?.destroy);
    },
    [closeTabs, aliveRef],
  );

  /**
   * 处理编辑
   * @param targetKey - 目标key值
   * @param action - 动作
   */
  const onEdit = useCallback(
    (targetKey: string | React.MouseEvent | React.KeyboardEvent, action: 'add' | 'remove') => {
      if (action === 'remove') {
        remove(targetKey as string);
      }
    },
    [remove],
  );

  /**
   * 刷新标签
   * @param key - 点击值
   */
  const onClickRefresh = useCallback(
    (key = activeKey) => {
      if (typeof key !== 'string') return;
      if (timerRef.current || refreshTime) return;

      setRefresh(true);
      aliveRef.current?.refresh(key);

      timerRef.current = setTimeout(() => {
        messageApi.success({
          content: t('public.refreshSuccessfully'),
          key: 'refresh',
        });
        setRefresh(false);
        timerRef.current = null;
      }, 300);

      if (refreshTime) {
        clearTimeout(refreshTime);
      }

      setRefreshTime(
        setTimeout(() => {
          setRefreshTime(null);
        }, 1000),
      );
    },
    [activeKey, refreshTime, messageApi, t, setRefresh, aliveRef],
  );

  /**
   * 拖拽结束
   */
  const onDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (active.id === over?.id) return;

      const oldIndex = tabs.findIndex((item) => item.key === active.id);
      const newIndex = tabs.findIndex((item) => item.key === over?.id);
      const newTabs = arrayMove(tabs, oldIndex, newIndex);
      sortTabs(newTabs);
    },
    [tabs, sortTabs],
  );

  // 下拉菜单
  const dropdownMenuParams = useMemo(
    () => ({ activeKey, handleRefresh: onClickRefresh }),
    [activeKey, onClickRefresh],
  );
  const [dropdownItems, onDropdownClick] = useDropdownMenu(dropdownMenuParams);

  /**
   * 渲染 TabBar
   */
  const renderTabBar: TabsProps['renderTabBar'] = useMemo(
    () => (tabBarProps, DefaultTabBar) => (
      <DndContext sensors={[sensor]} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
        <SortableContext items={tabs.map((i) => i.key)} strategy={horizontalListSortingStrategy}>
          <DefaultTabBar {...tabBarProps}>
            {(node) => (
              <DraggableTabNode
                {...(node as React.ReactElement<DraggableTabPaneProps>).props}
                key={node.key}
              >
                <div>
                  <Dropdown
                    menu={{
                      items: dropdownItems(node.key as string),
                      onClick: (e) => onDropdownClick(e.key, node.key as string),
                    }}
                    trigger={['contextMenu']}
                  >
                    {node}
                  </Dropdown>
                </div>
              </DraggableTabNode>
            )}
          </DefaultTabBar>
        </SortableContext>
      </DndContext>
    ),
    [sensor, tabs, onDragEnd, dropdownItems, onDropdownClick],
  );

  // 操作按钮渲染
  const tabOptions = useMemo(
    () => [
      {
        element: <TabRefresh isRefresh={!!refreshTime} onClick={onClickRefresh} />,
      },
      {
        element: <TabOptions activeKey={activeKey} handleRefresh={onClickRefresh} />,
      },
      { element: <TabMaximize /> },
    ],
    [refreshTime, onClickRefresh, activeKey],
  );

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (refreshTime) {
        clearTimeout(refreshTime);
      }
    };
  }, [refreshTime]);

  return (
    <div
      ref={tabsContainerRef}
      className={`
        w-[calc(100%-5px)]
        flex
        items-center
        justify-between
        mx-2
        transition-all
        ${isMaximize ? styles['con-maximize'] : ''}
      `}
    >
      {contextHolder}
      <div className="w-[calc(100%-110px)]">
        {tabs.length > 0 ? (
          <Tabs
            hideAdd
            className={`h-30px py-0 ${styles['layout-tabs']}`}
            items={tabs}
            onChange={onChange}
            activeKey={activeKey}
            tabPlacement="top"
            type="editable-card"
            onEdit={onEdit}
            renderTabBar={renderTabBar}
          />
        ) : null}
      </div>

      <div className="flex">
        {tabOptions.map((item, index) => (
          <div
            key={index}
            className={`
              left-divide-tab
              change
              divide-solid
              w-36px
              h-36px
              hover:opacity-70
              flex
              place-content-center
              items-center
            `}
          >
            {item.element}
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(LayoutTabs);
