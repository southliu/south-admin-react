import type { MouseEventHandler, ReactNode, RefObject } from 'react';
import type { ModalProps } from 'antd';
import type { DraggableData, DraggableEvent } from 'react-draggable';
import { useEffect, useRef, useState } from 'react';
import { Modal, Spin, Tooltip } from 'antd';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useCommonStore } from '@/hooks/useCommonStore';
import Draggable from 'react-draggable';
import './index.less';

interface Props extends Omit<ModalProps, 'onCancel'> {
  isLoading?: boolean;
  onCancel: () => void;
}

function BaseModal(props: Props) {
  const { width, children, wrapClassName, onCancel, isLoading = false } = props;
  const { t } = useTranslation();
  const { isPhone } = useCommonStore();
  const [isDisabled, setDisabled] = useState(true);
  const [isFullscreen, setFullscreen] = useState(false);
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const [cacheBounds, setCacheBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const draggleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFullscreen) {
      setBounds({ left: 0, top: 0, bottom: 0, right: 0 });
    } else {
      setBounds(cacheBounds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  /** 开始拖拽对话框 */
  const onStartMouse = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect?.();
    if (!targetRect) return;
    const data = {
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    };
    setBounds(data);
    setCacheBounds(data);
  };

  /** 鼠标拖拽移动 */
  const onMouseOver = () => {
    if (isDisabled) {
      setDisabled(false);
    }
  };

  /** 最大化 */
  const onFullscreen = () => {
    setFullscreen(!isFullscreen);
  };

  /** 点击关闭 */
  const handleCancel: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onCancel?.();
  };

  /** 自定义关闭和放大图标 */
  const CloseRender = (
    <div className="flex items-center justify-end absolute right-15px">
      <Tooltip
        className="hover:text-#404040"
        placement="bottom"
        title={!isFullscreen ? t('public.maximize') : t('public.exitMaximized')}
      >
        <div className="p-10px mt-3px cursor-pointer" onClick={onFullscreen}>
          <Icon
            className="text-lg"
            icon={
              !isFullscreen
                ? 'ant-design:fullscreen-outlined'
                : 'ant-design:fullscreen-exit-outlined'
            }
          />
        </div>
      </Tooltip>
      <Tooltip placement="bottom" title={t('public.close')}>
        <div className="p-10px mt-3px cursor-pointer" onClick={handleCancel}>
          <Icon className="text-lg" icon="ant-design:close-outlined" />
        </div>
      </Tooltip>
    </div>
  );

  /** 自定义标题 */
  const titleRender = (
    <div className="flex items-center">
      <div
        className="modal-custom-title"
        onMouseOver={onMouseOver}
        onMouseOut={() => setDisabled(true)}
      >
        <span className="cursor-text">{props.title || ''}</span>
      </div>
      {CloseRender}
    </div>
  );

  /** 自定义渲染对话框 */
  const modalRender = (modal: ReactNode) => (
    <Draggable
      nodeRef={draggleRef as RefObject<HTMLElement>}
      disabled={isDisabled}
      onStart={onStartMouse}
      bounds={isFullscreen ? undefined : bounds}
      position={isFullscreen ? { x: 0, y: 0 } : undefined}
    >
      <div ref={draggleRef}>{modal}</div>
    </Draggable>
  );

  return (
    <Modal
      destroyOnHidden
      closable={false}
      maskClosable={false}
      modalRender={!isPhone ? modalRender : undefined}
      okText={t('public.ok')}
      cancelText={t('public.cancel')}
      {...props}
      className={`base-modal ${props.className}`}
      title={titleRender}
      wrapClassName={isFullscreen ? 'full-modal' : wrapClassName || ''}
      width={isFullscreen ? '100%' : width || 520}
    >
      <Spin spinning={isLoading}>
        <div className="base-modal-content">{children}</div>
      </Spin>
    </Modal>
  );
}

export default BaseModal;
