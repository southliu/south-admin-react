import { changeMenuState } from '@/servers/system/menu';
import { Popconfirm, Switch } from 'antd';

// 当前行数据
interface RowData {
  id: string;
  label: string;
  labelEn: string;
}

interface Props {
  value: number;
  record: object;
}

function StateSwitch(props: Props) {
  const { value, record } = props;
  const { id, label, labelEn } = record as RowData;
  const { t, i18n } = useTranslation();
  const [isLoading, setLoading] = useState(false);

  const onChange = async () => {
    setLoading(true);
    await changeMenuState({ id, state: value ? 0 : 1 });
    setLoading(false);
  };

  return (
    <Popconfirm
      title={t('systems:menu.changeState')}
      description={t('systems:menu.changeStateMsg', {
        name: i18n.language === 'zh' ? label : labelEn,
        state: value ? t('public.hide') : t('public.show'),
      })}
      onConfirm={onChange}
    >
      <Switch
        checked={!!value}
        loading={isLoading}
        checkedChildren={t('public.show')}
        unCheckedChildren={t('public.hide')}
      />
    </Popconfirm>
  );
}

export default StateSwitch;
