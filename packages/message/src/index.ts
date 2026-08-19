import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';
import {
  message as antdMessage,
  notification as antdNotification,
  Modal as antdModal,
  App,
} from 'antd';

// antd v6 对象配置省略 duration 时会合成 duration: undefined，
// rc-notification 将非 number 视为 0，导致提示永不自动关闭。
// 这里统一补默认时长（与 antd v5 行为一致），显式传 0 仍可保持常驻。
const DEFAULT_MESSAGE_DURATION = 3;

function withDefaultDuration(instance: MessageInstance): MessageInstance {
  const patched: Record<string, unknown> = { ...instance };
  for (const type of ['open', 'info', 'success', 'warning', 'error', 'loading'] as const) {
    patched[type] = (...args: unknown[]) => {
      const first = args[0];
      if (
        first !== null &&
        typeof first === 'object' &&
        'content' in first &&
        (first as { duration?: number }).duration === undefined
      ) {
        args[0] = { duration: DEFAULT_MESSAGE_DURATION, ...first };
      }
      return (instance[type] as (...a: unknown[]) => unknown)(...args);
    };
  }
  return patched as unknown as MessageInstance;
}

let message: MessageInstance = withDefaultDuration(antdMessage);
let notification: NotificationInstance = antdNotification;

const { ...resetFns } = antdModal;
let modal: Omit<ModalStaticFunctions, 'warn'> = resetFns;

/**
 * 该组件提供静态方法
 * 作用：跨页面message显示
 */
function StaticMessage() {
  const staticFunctions = App.useApp();

  message = withDefaultDuration(staticFunctions.message);
  notification = staticFunctions.notification;
  modal = staticFunctions.modal;

  return null;
}

export { message, notification, modal };

export default StaticMessage;
