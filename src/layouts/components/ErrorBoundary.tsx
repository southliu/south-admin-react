import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result, Tooltip } from 'antd';
import { LogoutOutlined, MessageOutlined, RedoOutlined } from '@ant-design/icons';
import { useUserStore } from '@/stores/user';
import { createLog } from '@/servers/log/log';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// 错误内容组件
const ErrorContent = ({ error }: { error: Error | null }) => {
  const [handleLogout] = useLogout();
  const { t } = useTranslation();

  /** 刷新当前页面 */
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center h-full">
      <Result
        status="error"
        title={t('public.pageErrorTitle')}
        subTitle={
          <div className="flex">
            <Tooltip title={String(error)} placement="top">
              <MessageOutlined className="mr-5px rotate-y-180" />
            </Tooltip>
            {t('public.pagepageErrorSubTitle')}
          </div>
        }
        extra={[
          <Button key="refresh" type="primary" icon={<RedoOutlined />} onClick={handleRefresh}>
            {t('public.refreshPage')}
          </Button>,
          <Button key="hard-refresh" icon={<LogoutOutlined />} onClick={handleLogout}>
            {t('public.signOut')}
          </Button>,
        ]}
      />
    </div>
  );
};

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true, error: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 错误日志打印
    console.error('错误信息:', error, errorInfo);
    this.setState({ error });

    // 将错误信息上传至服务器
    this.sendErrorLog(error, errorInfo);
  }

  private async sendErrorLog(error: Error, errorInfo: ErrorInfo) {
    try {
      // 获取用户信息
      const userInfo = useUserStore.getState().userInfo;

      // 准备日志数据（根据后端 Log 实体字段）
      const logData = {
        username: userInfo?.username || 'anonymous',
        ip: '',
        method: '',
        url: window.location.href,
        params: JSON.stringify({
          componentStack: errorInfo.componentStack,
          content: JSON.stringify(errorInfo),
        }),
        userAgent: navigator.userAgent,
        status: '500',
        error: error.toString(),
        latency: 0,
        type: 3, // 0=error, 1=success, 3=frontend
      };

      // 发送错误日志到服务器
      await createLog(logData);
    } catch (e) {
      console.error('发送错误日志失败:', e);
    }
  }

  public render() {
    if (this.state.hasError) {
      return <ErrorContent error={this.state.error} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
