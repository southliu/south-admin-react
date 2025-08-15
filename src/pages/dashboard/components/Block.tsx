import { Row, Col } from 'antd';
import { Icon } from '@iconify/react';

function Block() {
  const { t } = useTranslation();
  const { isPhone } = useCommonStore();

  const data = [
    { title: t('dashboard.usersNumber'), num: 14966, all: 16236, icon: 'icon-park:peoples' },
    { title: t('dashboard.rechargeAmount'), num: 4286, all: 6142, icon: 'icon-park:paper-money' },
    {
      title: t('dashboard.orderNumber'),
      num: 5649,
      all: 5232,
      icon: 'icon-park:transaction-order',
    },
    { title: t('dashboard.gameNumber'), num: 619, all: 2132, icon: 'icon-park:game-handle' },
  ];

  return (
    <Row gutter={16}>
      {data.map((item) => (
        <Col
          key={item.title}
          sm={24}
          md={12}
          lg={6}
          className={`pb-10px ${isPhone ? 'w-full' : ''}`}
        >
          <div
            className={`
              border
              border-gray-200
              px-30px
              py-20px
              box-border
              rounded-10px
            `}
          >
            <div className="text-20px font-bold">{item.title}</div>
            <div className="flex items-center justify-between text-35px mb-15px">
              <Count className="font-bold" start={0} end={item.num} />
              <Icon icon={item.icon} />
            </div>
            <div className="flex align-center justify-between">
              <span>{t('public.total')}：</span>
              <Count start={0} end={item.all} />
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
}

export default Block;
