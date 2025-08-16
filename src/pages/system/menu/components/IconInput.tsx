import { QuestionCircleOutlined } from '@ant-design/icons';
import { Icon } from '@iconify/react';
import { Input, Tooltip, type InputProps } from 'antd';

function IconInput(props: InputProps) {
  const { value, onChange } = props;
  const { t } = useTranslation();

  return (
    <div className="flex items-center">
      <Input
        {...props}
        value={value}
        onChange={(e) => {
          onChange?.(e);
        }}
      />

      <div className="w-30px h-30px ml-10px flex items-center justify-center b b-#d9d9d9 rd-6px">
        <Icon icon={value as string} className="text-16px" />
      </div>

      <Tooltip title={t('systems:menu.helpIcon')}>
        <div
          className="pl-10px pr-2px cursor-pointer"
          onClick={() => window.open('https://icon-sets.iconify.design', '_blank')}
        >
          <QuestionCircleOutlined />
        </div>
      </Tooltip>
    </div>
  );
}

export default IconInput;
