import { useState, useEffect } from 'react';
import type { TableColumn } from '#/public';
import { useTranslation } from 'react-i18next';
import BaseTable from '@/components/Table/BaseTable';

function VirtualTable() {
  const { t } = useTranslation();
  const [tableData, setTableData] = useState<object[]>([]);

  const columns: TableColumn[] = [
    { title: 'ID', dataIndex: 'id', width: 200 },
    { title: t('public.name'), dataIndex: 'name', width: 200 },
    { title: t('system.phone'), dataIndex: 'phone', width: 200 },
    { title: t('system.age'), dataIndex: 'number', width: 200 },
  ];

  useEffect(() => {
    const data = new Array(0).fill({});
    for (let i = 0; i < 10000; i++) {
      const num = i + 1;
      data.push({
        id: num,
        name: 'name' + num,
        phone: num * 13,
        number: num * 3,
      });
    }
    setTableData(data);
  }, []);

  return (
    <BaseTable isVirtual columns={columns} dataSource={tableData} scrollY={500} isOperate={false} />
  );
}

export default VirtualTable;
