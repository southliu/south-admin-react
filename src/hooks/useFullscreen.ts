import { useCommonStore } from './useCommonStore';
import { usePublicStore } from '@/stores/public';

export function useFullscreen() {
  const { isFullscreen } = useCommonStore();
  const setFullscreen = usePublicStore((state) => state.setFullscreen);

  /** 切换全屏 */
  const toggleFullscreen = () => {
    // 全屏
    if (!isFullscreen && document.documentElement?.requestFullscreen) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
      return true;
    }
    // 退出全屏
    if (isFullscreen && document?.exitFullscreen) {
      document.exitFullscreen();
      setFullscreen(false);
      return true;
    }
  };

  return [isFullscreen, toggleFullscreen] as const;
}
