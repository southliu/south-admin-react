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
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  memo,
  useRef,
  startTransition,
  type RefObject,
} from 'react';
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
  const sensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } });
  const [messageApi, contextHolder] = message.useMessage();
  const [isChangeLang, setChangeLang] = useState(false); // 是否切换语言
  const [refreshTime, seRefreshTime] = useState<null | NodeJS.Timeout>(null);
  const timer = useRef<null | NodeJS.Timeout>(null);
  const setRefresh = usePublicStore((state) => state.setRefresh);
  const {
    tabs,
    isCloseTabsLock,
    activeKey, // 选中的标签值
    setActiveKey,
    addTabs,
    sortTabs,
    closeTabs,
    setNav,
    toggleCloseTabsLock,
    switchTabsLang,
  } = useTabsStore(useShallow((state) => state));

  // 获取当前语言
  const currentLanguage = i18n.language;

  const { permissions, isMaximize, menuList } = useCommonStore();

  /**
   * 添加标签
   * @param path - 路径
   */
  const handleAddTab = useCallback(
    (path = pathname) => {
      // 当值为空时匹配路由
      if (permissions.length > 0) {
        if (path === '/') return;
        const menuByKeyProps = {
          menus: menuList,
          permissions,
          key: path,
        };
        const newItems = getMenuByKey(menuByKeyProps);
        if (newItems?.key) {
          setActiveKey(newItems.key);
          setNav(newItems.nav);
          addTabs(newItems);
          // 初始化Tabs时，更新文案语言类型
          setChangeLang(true);
        } else {
          setActiveKey(path);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissions, menuList],
  );

  // 只在权限和菜单列表变化时添加标签
  useEffect(() => {
    if (permissions.length > 0 && menuList.length > 0) {
      handleAddTab();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions, menuList]);

  // 监听 pathname 变化，添加标签（使用 startTransition 标记为非紧急更新）
  useEffect(() => {
    if (permissions.length > 0 && menuList.length > 0 && pathname) {
      startTransition(() => {
        handleAddTab(pathname);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /**
   * 设置浏览器标签
   * @param list - 菜单列表
   * @param path - 路径
   */
  const handleSetTitle = useCallback(() => {
    const title = getTabTitle(tabs, pathname);
    if (title) setTitle(t, title);
  }, [pathname]);

  useEffect(() => {
    switchTabsLang(currentLanguage);
  }, [currentLanguage, switchTabsLang]);

  useEffect(() => {
    if (isChangeLang) {
      switchTabsLang(currentLanguage);
      setChangeLang(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChangeLang]);

  useEffect(() => {
    handleSetTitle();

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }

      if (refreshTime) {
        clearTimeout(refreshTime);
        seRefreshTime(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 根据路由匹配对应的urlParams */
  const getUrlParamsByRouterKey = (key: string) => {
    for (let i = 0; i < tabs?.length; i++) {
      const item = tabs[i];

      if (item.key === key) {
        return item?.urlParams || '';
      }
    }

    return '';
  };

  /** 跳转页面 */
  const handleNavigateTo = (key: string) => {
    startTransition(() => {
      const urlParams = getUrlParamsByRouterKey(key);
      navigate(`${key}${urlParams}`);
    });
  };

  useEffect(() => {
    // 当选中标签不等于当前路由则跳转（使用 startTransition 标记为非紧急更新）
    if (activeKey !== pathname) {
      startTransition(() => {
        const key = isCloseTabsLock ? activeKey : pathname;
        handleSetTitle();

        // 如果是关闭标签则直接跳转
        if (isCloseTabsLock) {
          toggleCloseTabsLock(false);
          handleUpdateBreadcrumb(key);
          handleNavigateTo(key);
        } else {
          handleAddTab(key);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, pathname]);

  /**
   * 处理更改
   * @param key - 唯一值
   */
  const onChange = (key: string) => {
    startTransition(() => {
      handleNavigateTo(key);
    });
  };

  /**
   * 更新面包屑
   * @param key - 菜单
   */
  const handleUpdateBreadcrumb = (key: string) => {
    if (pathname !== key) {
      const menuByKeyProps = {
        menus: menuList,
        permissions,
        key,
      };
      const newItems = getMenuByKey(menuByKeyProps);
      if (newItems?.key) {
        setNav(newItems.nav);
      }
    }
  };

  /**
   * 删除标签
   * @param targetKey - 目标key值
   */
  const remove = (targetKey: string) => {
    closeTabs(targetKey, aliveRef.current?.destroy);
  };

  /**
   * 处理编辑
   * @param targetKey - 目标key值
   * @param action - 动作
   */
  const onEdit: TabsProps['onEdit'] = (targetKey, action) => {
    if (action === 'remove') {
      remove(targetKey as string);
    }
  };

  /**
   * 点击重新加载
   * @param key - 点击值
   */
  const onClickRefresh = useCallback(
    (key = activeKey) => {
      // 如果key不是字符串格式则退出
      if (typeof key !== 'string') return;

      // 定时器没有执行时运行
      if (!timer.current) {
        setRefresh(true);
        aliveRef.current?.refresh(key);

        timer.current = setTimeout(() => {
          messageApi.success({
            content: t('public.refreshSuccessfully'),
            key: 'refresh',
          });
          setRefresh(false);
          timer.current = null;
        }, 100);

        seRefreshTime(
          setTimeout(() => {
            seRefreshTime(null);
          }, 1000),
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeKey, timer],
  );

  // 渲染重新加载
  const RefreshRender = useMemo(() => {
    return <TabRefresh isRefresh={!!refreshTime} onClick={onClickRefresh} />;
  }, [refreshTime, onClickRefresh]);

  // 渲染标签操作
  const TabOptionsRender = useMemo(() => {
    return <TabOptions activeKey={activeKey} handleRefresh={onClickRefresh} />;
  }, [activeKey, onClickRefresh]);

  // 渲染最大化操作
  const TabMaximizeRender = useMemo(() => {
    return <TabMaximize />;
  }, []);

  // 标签栏功能
  const tabOptions = [
    { element: RefreshRender },
    { element: TabOptionsRender },
    { element: TabMaximizeRender },
  ];

  // 下拉菜单
  const dropdownMenuParams = { activeKey, handleRefresh: onClickRefresh };
  const [items, onClick] = useDropdownMenu(dropdownMenuParams);

  /** 处理拖拽结束 */
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      const oldIndex = tabs.findIndex((item) => item.key === active.id);
      const newIndex = tabs.findIndex((item) => item.key === over?.id);
      const newTabs = arrayMove(tabs, oldIndex, newIndex);
      sortTabs(newTabs);
    }
  };

  /** 二次封装标签 */
  const renderTabBar: TabsProps['renderTabBar'] = (tabBarProps, DefaultTabBar) => (
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
                    items: items(node.key as string),
                    onClick: (e) => onClick(e.key, node.key as string),
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
  );

  return (
    <div
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
      {tabs.length > 0 ? (
        <Tabs
          hideAdd
          className={`w-[calc(100%-110px)] h-30px py-0 ${styles['layout-tabs']}`}
          items={[...tabs]}
          onChange={onChange}
          activeKey={activeKey}
          type="editable-card"
          onEdit={onEdit}
          renderTabBar={renderTabBar}
        />
      ) : (
        <span></span>
      )}

      <div className="flex">
        {tabOptions?.map((item, index) => (
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
