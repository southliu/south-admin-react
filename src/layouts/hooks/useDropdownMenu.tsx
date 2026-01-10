import type { MenuProps } from 'antd';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  RedoOutlined,
  CloseOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
} from '@ant-design/icons';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useTabsStore } from '@/stores';
import { useShallow } from 'zustand/shallow';

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
  const { tabs } = useCommonStore();
  const { closeLeft, closeOther, closeRight, closeTabs } = useTabsStore((state) => state);
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));

  // 菜单项
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

  /** 点击菜单 */
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
        closeTabs(key, aliveRef.current?.destroy);
        break;

      // 关闭其他
      case ITabEnums.CLOSE_OTHER:
        closeOther(key, aliveRef.current?.destroy);
        break;

      // 关闭左侧
      case ITabEnums.CLOSE_LEFT:
        closeLeft(key, aliveRef.current?.destroy);
        break;

      // 关闭右侧
      case ITabEnums.CLOSE_RIGHT:
        closeRight(key, aliveRef.current?.destroy);
        break;

      default:
        break;
    }
  };

  return [items, onClick] as const;
}
