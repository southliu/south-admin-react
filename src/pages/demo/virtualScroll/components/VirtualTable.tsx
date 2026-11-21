import type { TableColumn } from '#/public';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import BaseTable from '@/components/Table/BaseTable';

function VirtualTable() {
  const { t } = useTranslation();
  const [tableData] = useState<object[]>(() =>
    Array.from({ length: 10000 }, (_, index) => ({
      id: index + 1,
      name: 'name' + (index + 1),
      phone: (index + 1) * 13,
      number: (index + 1) * 3,
    })),
  );

  const columns: TableColumn[] = [
    { title: 'ID', dataIndex: 'id', width: 200 },
    { title: t('public.name'), dataIndex: 'name', width: 200 },
    { title: t('system.phone'), dataIndex: 'phone', width: 200 },
    { title: t('system.age'), dataIndex: 'number', width: 200 },
  ];

  return (
    <BaseTable isVirtual columns={columns} dataSource={tableData} scrollY={500} isOperate={false} />
  );
}

export default VirtualTable;
