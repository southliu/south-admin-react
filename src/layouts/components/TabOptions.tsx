import { useDropdownMenu } from '../hooks/useDropdownMenu';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Dropdown } from 'antd';

interface Props {
  activeKey: string;
  handleRefresh: (activeKey: string) => void;
}

function TabOptions(props: Props) {
  const { activeKey, handleRefresh } = props;
  const [isOpen, setOpen] = useState(false);

  /**
   * 菜单显示变化
   * @param open - 显示值
   */
  const onOpenChange = (open: boolean) => {
    setOpen(open);
  };

  // 下拉菜单
  const dropdownMenuParams = { activeKey, onOpenChange, handleRefresh };
  const [items, onClick] = useDropdownMenu(dropdownMenuParams);

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: items(),
        onClick: (e) => onClick(e.key),
      }}
      onOpenChange={onOpenChange}
    >
      <Icon
        className={`
          flex
          items-center
          justify-center
          text-lg
          cursor-pointer
          transition-all
          transform
          ${isOpen ? 'rotate-180' : 'rotate-0'}
        `}
        icon="ant-design:down-outlined"
      />
    </Dropdown>
  );
}

export default TabOptions;
