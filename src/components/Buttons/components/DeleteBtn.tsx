import type { ButtonProps } from 'antd';
import { Button, Popconfirm } from 'antd';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined } from '@ant-design/icons';

interface Props extends ButtonProps {
  isLoading?: boolean;
  btnType?: 'delete' | 'batchDelete';
  name?: string;
  customizeTitle?: string;
  isIcon?: boolean;
  handleDelete: () => void;
}

function DeleteBtn(props: Props) {
  const {
    isLoading,
    loading,
    isIcon,
    customizeTitle,
    name,
    btnType = 'delete',
    className,
    handleDelete,
  } = props;
  const { t } = useTranslation();

  // 清除自定义属性
  const params: Partial<Props> = { ...props };
  delete params.isIcon;
  delete params.isLoading;
  delete params.handleDelete;

  return (
    <Popconfirm
      title={t('public.kindTips')}
      description={t(
        btnType === 'delete' ? 'public.deleteConfirmMessage' : 'public.batchDeleteConfirmMessage',
        { name: name ? ` ${name} ` : '' },
      )}
      onConfirm={handleDelete}
    >
      <Button
        danger
        type="primary"
        {...params}
        className={`${className} small-btn`}
        icon={params?.icon || (isIcon && <DeleteOutlined />)}
        loading={!!isLoading || loading}
      >
        {customizeTitle || btnType === 'delete' ? t('public.delete') : t('public.batchDelete')}
      </Button>
    </Popconfirm>
  );
}

export default DeleteBtn;
