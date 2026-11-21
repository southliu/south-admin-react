import { createRoot } from 'react-dom/client';
import { useMemo, useState } from 'react';
import { ConfigProvider } from 'antd';
import ApiPageSelect from '../../src/components/Selects/ApiPageSelect';
import ApiSelect from '../../src/components/Selects/ApiSelect';
import BaseTable from '../../src/components/Table/BaseTable';
import '../../src/locales/config';
import 'uno.css';

const api = async (params?: object) => {
  const query = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
  return (await fetch(`/test/options?${query}`)).json();
};
export default function Fixture() {
  const [department, setDepartment] = useState('a');
  const [disabled, setDisabled] = useState(false);
  const params = useMemo(() => ({ department }), [department]);
  const data = useMemo(
    () => Array.from({ length: 10000 }, (_, id) => ({ id, name: `row-${id}` })),
    [],
  );
  return (
    <ConfigProvider>
      <main style={{ padding: 24 }}>
        <button onClick={() => setDepartment('b')}>切换部门</button>
        <button onClick={() => setDisabled((previous) => !previous)}>切换禁用</button>
        <div data-testid="select">
          <ApiSelect
            aria-label="普通下拉"
            api={api}
            params={params}
            disabled={disabled}
            style={{ width: 240 }}
          />
        </div>
        <div data-testid="page-select">
          <ApiPageSelect aria-label="分页搜索" api={api} params={params} style={{ width: 240 }} />
        </div>
        <BaseTable
          isVirtual
          isOperate={false}
          scrollY={240}
          scrollX={800}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 200 },
            { title: '名称', dataIndex: 'name', width: 600 },
          ]}
          dataSource={data}
        />
      </main>
    </ConfigProvider>
  );
}
createRoot(document.getElementById('root') as HTMLElement).render(<Fixture />);
