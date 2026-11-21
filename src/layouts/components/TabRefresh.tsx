import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Tooltip } from 'antd';

interface Props {
  isRefresh: boolean;
  onClick: () => void;
}

function TabRefresh(props: Props) {
  const { t } = useTranslation();
  const { isRefresh, onClick } = props;

  return (
    <Tooltip title={t('public.reload')} placement="bottom">
      <Icon
        className={`
          change
          flex
          items-center
          justify-center
          text-lg
          cursor-pointer
          ${isRefresh ? 'animate-spin pointer-events-none' : ''}
        `}
        onClick={() => onClick()}
        icon="ant-design:reload-outlined"
      />
    </Tooltip>
  );
}

export default TabRefresh;
