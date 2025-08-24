import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result, Tooltip } from 'antd';
import { LogoutOutlined, MessageOutlined, RedoOutlined } from '@ant-design/icons';
import { useUserStore } from '@/stores/user';
import axios from 'axios';
import dayjs from 'dayjs';

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

      // 获取客户端IP
      let ip = 'unknown';
      try {
        const ipResponse = await axios.get('https://httpbin.org/ip');
        ip = ipResponse.data.origin || 'unknown';
      } catch (e) {
        console.error('获取IP失败:', e);
      }

      // 准备日志数据
      const logData = {
        ip,
        userInfo,
        error: error.toString(),
        errorInfo: JSON.stringify(errorInfo),
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        type: 'frontError',
      };

      // 发送错误日志到服务器
      await axios.post('/log/create', logData);
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
