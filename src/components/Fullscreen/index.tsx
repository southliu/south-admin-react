import { useFullscreen } from '@/hooks/useFullscreen';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Tooltip } from 'antd';

/**
 * @description: 全屏组件
 */
function Fullscreen() {
  const { t } = useTranslation();
  const [isFullscreen, toggleFullscreen] = useFullscreen();

  return (
    <Tooltip title={isFullscreen ? t('public.exitFullscreen') : t('public.fullScreen')}>
      <div
        className="flex items-center justify-center text-lg mr-3 cursor-pointer"
        onClick={toggleFullscreen}
      >
        <Icon
          icon="gridicons-fullscreen-exit"
          style={{ display: isFullscreen ? 'block' : 'none' }}
        />
        <Icon icon="gridicons-fullscreen" style={{ display: !isFullscreen ? 'block' : 'none' }} />
      </div>
    </Tooltip>
  );
}

export default Fullscreen;
