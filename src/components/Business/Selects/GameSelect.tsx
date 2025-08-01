import type { SelectProps } from 'antd';
import { getGames } from '@/servers/platform/game';
import { ApiSelect } from '@/components/Selects';

/**
 * @description: 游戏下拉组件
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
