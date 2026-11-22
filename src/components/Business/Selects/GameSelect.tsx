import type { SelectProps } from 'antd';
import { getGames } from '@/servers/platform/game';
import { ApiSelect } from '@/components/Selects';

/**
 * 游戏下拉组件
 * @param props - 组件配置，用于设置展示内容和交互回调
 */
function GameSelect(props: SelectProps) {
  return (
    <>
      <ApiSelect
        {...props}
        mode="multiple"
        api={getGames}
        fieldNames={{ label: 'name', value: 'id' }}
      />
    </>
  );
}

export default GameSelect;
