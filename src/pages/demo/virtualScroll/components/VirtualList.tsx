import { List, type RowComponentProps } from 'react-window';
import { useCommonStore } from '@/hooks/useCommonStore';

function VirtualList() {
  const { theme } = useCommonStore();

  const names = useMemo(() => {
    return Array.from({ length: 10000 }, (_, i) => `Name ${i + 1}`);
  }, []);

  function RowComponent({
    index,
    names,
    style,
  }: RowComponentProps<{
    names: string[];
  }>) {
    return (
      <div
        className={`flex items-center justify-between px-10px box-border ${theme === 'dark' && index % 2 ? '!bg-#141414' : ''}`}
        style={style}
      >
        {names[index]}
        <div className="text-slate-500 text-xs">{`${index + 1} of ${names.length}`}</div>
      </div>
    );
  }

  return <List rowCount={10000} rowHeight={35} rowComponent={RowComponent} rowProps={{ names }} />;
}

export default VirtualList;
