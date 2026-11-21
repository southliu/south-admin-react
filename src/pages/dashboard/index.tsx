import type { BaseFormData } from '#/form';
import { useState, useCallback, useEffect } from 'react';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useEffectOnActive } from 'keepalive-for-react';
import { checkPermission } from '@/utils/permissions';
import { getDataTrends } from '@/servers/dashboard';
import { useTranslation } from 'react-i18next';
import { searchList } from './model';
import BaseContent from '@/components/Content/BaseContent';
import BaseSearch from '@/components/Search/BaseSearch';
import BaseCard from '@/components/Card/BaseCard';
import Block from './components/Block';
import Line from './components/Line';
import Bar from './components/Bar';

// 初始化搜索
const initSearch = {
  pay_date: ['2022-10-19', '2022-10-29'],
};

function Dashboard() {
  const { t } = useTranslation();
  const { permissions, isPhone } = useCommonStore();
  const [isLoading, setLoading] = useState(false);
  const isPermission = checkPermission('/dashboard', permissions);

  /**
   * 搜索提交
   * @param values - 表单返回数据
   */
  const handleSearch = useCallback(async (values: BaseFormData) => {
    // 数据转换
    values.all_pay = values.all_pay ? 1 : undefined;

    const query = { ...values };
    try {
      setLoading(true);
      await getDataTrends(query);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleSearch(initSearch);
  }, [handleSearch]);

  useEffectOnActive(() => {
    console.log('进入和退出时执行');

    return () => {
      console.log('退出时执行');
    };
  }, []);

  useEffectOnActive(() => {
    console.log('第二次进入和退出时执行');

    return () => {
      console.log('第二次退出时执行');
    };
  }, []);

  return (
    <BaseContent isPermission={isPermission}>
      <BaseCard>
        <BaseSearch
          list={searchList(t)}
          data={initSearch}
          initialValues={initSearch}
          isLoading={isLoading}
          handleFinish={handleSearch}
        />
      </BaseCard>

      <BaseCard className="mt-10px">
        <div className="pt-10px">
          <Block />
        </div>

        <div className="flex flex-wrap justify-between w-full">
          <div className={`mb-10px ${isPhone ? 'w-full' : 'w-49.5%'}`}>
            <Line />
          </div>
          <div className={`mb-10px ${isPhone ? 'w-full' : 'w-49.5%'}`}>
            <Bar />
          </div>
        </div>
      </BaseCard>
    </BaseContent>
  );
}

export default Dashboard;
