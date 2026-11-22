import { useCommonStore } from '@/hooks/useCommonStore';
import { useTabsStore } from '@/stores';
import { Icon } from '@iconify/react';

function TabMaximize() {
  // 是否窗口最大化
  const { isMaximize } = useCommonStore(['isMaximize']);
  const toggleMaximize = useTabsStore((state) => state.toggleMaximize);

  /** 点击最大化/最小化 */
  const onClick = () => {
    toggleMaximize(!isMaximize);
  };

  return (
    <div className="text-lg cursor-pointer">
      <Icon
        style={{ display: isMaximize ? 'block' : 'none' }}
        icon="ant-design:compress-outlined"
        onClick={onClick}
      />

      <Icon
        style={{ display: !isMaximize ? 'block' : 'none' }}
        icon="ant-design:expand-outlined"
        onClick={onClick}
      />
    </div>
  );
}

export default TabMaximize;
