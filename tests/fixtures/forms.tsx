import type { BaseFormList } from '../../types/form';
import { App, ConfigProvider, Form } from 'antd';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import BaseSearch from '../../src/components/Search/BaseSearch';
import BaseForm from '../../src/components/Form/BaseForm';
import '../../src/locales/config';
import 'uno.css';

const initial = { agree: true, enabled: true, count: 1, files: [] };
const searchData = {};
const searchList: BaseFormList[] = Array.from({ length: 10 }, (_, index) => ({
  name: `field${index}`,
  label: `字段${index}`,
  component: 'Input',
  hidden: index === 0,
  componentProps: { maxLength: 50 },
}));
searchList.forEach(Object.freeze);
Object.freeze(searchList);

export default function Fixture() {
  const [snapshot, setSnapshot] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [callback, setCallback] = useState('');
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const list: BaseFormList[] = [
    { name: 'agree', label: '同意', component: 'Checkbox' },
    { name: 'enabled', label: '启用', component: 'Switch' },
    {
      name: 'count',
      label: '数量',
      component: 'InputNumber',
      rules: [{ required: true, message: '数量不能为空' }],
      componentProps: { onChange: (value: number | null) => setCallback(JSON.stringify(value)) },
    },
    {
      name: 'files',
      label: '文件',
      component: 'Upload',
      componentProps: { beforeUpload: () => false },
    },
  ];

  return (
    <ConfigProvider>
      <App>
        <main style={{ padding: 24 }}>
          <section data-testid="form">
            <BaseForm
              list={list}
              data={initial}
              form={form}
              onValuesChange={(changed) =>
                setEvents((previous) => [...previous, JSON.stringify(changed)])
              }
              handleFinish={() => setSnapshot(JSON.stringify(form.getFieldsValue()))}
            />
            <button onClick={() => setSnapshot(JSON.stringify(form.getFieldsValue()))}>
              读取表单
            </button>
            <button onClick={() => form.resetFields()}>重置表单</button>
            <output data-testid="values">{snapshot}</output>
            <output data-testid="events">{events.join('\n')}</output>
            <output data-testid="callback">{callback}</output>
          </section>
          <section
            data-testid="search"
            style={{ marginTop: 24 }}
          >
            <BaseSearch
              type="grid"
              list={searchList}
              data={searchData}
              searchForm={searchForm}
              handleFinish={(values) => setSnapshot(JSON.stringify(values))}
            />
          </section>
        </main>
      </App>
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<Fixture />);
