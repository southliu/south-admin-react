import type { MenuProps } from 'antd';
import {
  RedoOutlined,
  CloseOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCommonStore } from '@/hooks/useCommonStore';
import { getTabPath, getNextTab } from '../utils/tabs';
import { usePublicStore } from '@/stores/public';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';
import { useTabsStore } from '@/stores';

enum ITabEnums {
  REFRESH = 'refresh', // 重新加载
  CLOSE_CURRENT = 'close_current', // 关闭当前
  CLOSE_OTHER = 'close_other', // 关闭其他
  CLOSE_LEFT = 'close_left', // 关闭左侧
  CLOSE_RIGHT = 'close_right', // 关闭右侧
}

interface Props {
  activeKey: string;
  onOpenChange?: (open: boolean) => void;
  handleRefresh: (activeKey: string) => void;
}

export function useDropdownMenu(props: Props) {
  const { t } = useTranslation();
  const { activeKey, onOpenChange, handleRefresh } = props;
  const { pathname } = useLocation();
  const { tabs } = useCommonStore(['tabs']);
  const { closeLeft, closeOther, closeRight, closeTabs, setActiveKey } = useTabsStore(
    useShallow((state) => ({
      closeLeft: state.closeLeft,
      closeOther: state.closeOther,
      closeRight: state.closeRight,
      closeTabs: state.closeTabs,
      setActiveKey: state.setActiveKey,
    })),
  );
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));
  const navigate = useNavigate();

  /**
   * 菜单项
   * @param key - 目标标签或菜单的标识
   */
  const items: (key?: string) => MenuProps['items'] = (key = activeKey) => {
    const index = tabs.findIndex((item) => item.key === key);
    return [
      {
        key: ITabEnums.REFRESH,
        label: t('public.reload'),
        disabled: key !== pathname,
        icon: <RedoOutlined className="mr-5px transform rotate-270" />,
      },
      {
        key: ITabEnums.CLOSE_CURRENT,
        label: t('public.closeTab'),
        disabled: tabs.length <= 1,
        icon: <CloseOutlined className="mr-5px" />,
      },
      {
        key: ITabEnums.CLOSE_OTHER,
        label: t('public.closeOther'),
        disabled: tabs.length <= 1,
        icon: <VerticalAlignMiddleOutlined className="mr-5px transform rotate-90" />,
      },
      {
        key: ITabEnums.CLOSE_LEFT,
        label: t('public.closeLeft'),
        disabled: index === 0,
        icon: <VerticalAlignTopOutlined className="mr-5px transform rotate-270" />,
      },
      {
        key: ITabEnums.CLOSE_RIGHT,
        label: t('public.closeRight'),
        disabled: index === tabs.length - 1,
        icon: <VerticalAlignTopOutlined className="mr-5px transform rotate-90" />,
      },
    ];
  };

  /**
   * 点击菜单
   * @param type - 操作类型，用于确定执行的菜单动作
   * @param key - 目标标签或菜单的标识
   */
  const onClick = (type: string, key = activeKey) => {
    // 复原箭头
    onOpenChange?.(false);

    switch (type) {
      // 重新加载
      case ITabEnums.REFRESH:
        handleRefresh(key);
        break;

      // 关闭当前
      case ITabEnums.CLOSE_CURRENT:
        if (tabs.length <= 1) return;
        if (key === pathname) {
          const nextTab = getNextTab(tabs, key);
          if (nextTab) {
            setActiveKey(nextTab.key);
            navigate(getTabPath(tabs, nextTab.key));
          }
        }
        closeTabs(key, aliveRef.current?.destroy);

        break;

      // 关闭其他
      case ITabEnums.CLOSE_OTHER:
        closeOther(key, aliveRef.current?.destroy);
        navigate(getTabPath(tabs, key));
        break;

      // 关闭左侧
      case ITabEnums.CLOSE_LEFT:
        closeLeft(key, aliveRef.current?.destroy);
        navigate(getTabPath(tabs, key));
        break;

      // 关闭右侧
      case ITabEnums.CLOSE_RIGHT:
        closeRight(key, aliveRef.current?.destroy);
        navigate(getTabPath(tabs, key));
        break;

      default:
        break;
    }
  };

  return [items, onClick] as const;
}
