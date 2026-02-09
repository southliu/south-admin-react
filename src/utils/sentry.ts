import * as Sentry from '@sentry/react';

/**
 * Sentry 配置接口
 */
interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  beforeSend?: (event: Sentry.ErrorEvent) => Sentry.ErrorEvent | null;
}

/**
 * 默认配置
 */
const defaultConfig: SentryConfig = {
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1, // 10% 的用户会话将被追踪
  replaysSessionSampleRate: 0.1, // 10% 的正常会话被录制
  replaysOnErrorSampleRate: 1.0, // 100% 的错误会话被录制

  // 发送前过滤敏感信息
  beforeSend(event) {
    // 移除敏感的请求头
    if (event.request?.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
      delete event.request.headers['x-auth-token'];
    }

    // 移除敏感的查询参数
    if (event.request?.query_string) {
      const queryString =
        typeof event.request.query_string === 'string'
          ? event.request.query_string
          : String(event.request.query_string);
      event.request.query_string = queryString
        .split('&')
        .filter(
          (param: string) =>
            !param.toLowerCase().startsWith('password') && !param.toLowerCase().startsWith('token'),
        )
        .join('&');
    }

    return event;
  },
};

/**
 * 初始化 Sentry
 */
export function initSentry(config: SentryConfig = {}): void {
  // 如果没有提供 DSN，不初始化 Sentry
  if (!config.dsn && !import.meta.env.VITE_SENTRY_DSN) {
    if (import.meta.env.MODE === 'development') {
      console.warn('Sentry DSN not configured, skipping initialization');
    }
    return;
  }

  const finalConfig = {
    ...defaultConfig,
    ...config,
    dsn: config.dsn || import.meta.env.VITE_SENTRY_DSN,
    release: config.release || import.meta.env.VITE_APP_VERSION || '1.0.0',
  };

  Sentry.init({
    dsn: finalConfig.dsn,
    environment: finalConfig.environment,
    release: finalConfig.release,

    // 性能监控
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.breadcrumbsIntegration({
        console: true,
        dom: true,
        fetch: true,
        history: true,
        xhr: true,
      }),
    ],

    // 设置追踪采样率
    tracesSampleRate: finalConfig.tracesSampleRate || 0.1,

    // 设置回放采样率
    replaysSessionSampleRate: finalConfig.replaysSessionSampleRate || 0.1,
    replaysOnErrorSampleRate: finalConfig.replaysOnErrorSampleRate || 1.0,

    // 发送前处理
    beforeSend: finalConfig.beforeSend,

    // 过滤不必要的错误
    ignoreErrors: [
      // 随机错误，通常由浏览器扩展引起
      /(^|\s)Script error\.?(\s|$)/i,
      // Facebook 相关错误
      /com\.facebook\.*/,
      // chrome-extension 错误
      /chrome-extension:\/\//,
      // 已知的第三方错误
      /_reactDom\..*\.hydrate/,
      /Non-Error promise rejection captured/,
    ],

    // 过滤不必要的 URL
    denyUrls: [
      // Chrome 扩展
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // Facebook
      /graph\.facebook\.com/i,
      /connect\.facebook\.net/i,
      // 第三方脚本
      /static\.doubleclick\.net/i,
      /google-analytics\.com/i,
      /googletagmanager\.com/i,
      /googleads\.com/i,
    ],
  });

  if (import.meta.env.MODE === 'development') {
    console.log('✅ Sentry initialized with DSN:', finalConfig.dsn);
  }
}

/**
 * 手动捕获错误
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value as Record<string, unknown>);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * 捕获消息
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * 设置用户信息
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  Sentry.setUser(user);
}

/**
 * 清除用户信息
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * 添加面包屑
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level: Sentry.SeverityLevel = 'info',
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
  });
}

export { Sentry };
export default { initSentry, captureException, captureMessage, setUser, clearUser, addBreadcrumb };
