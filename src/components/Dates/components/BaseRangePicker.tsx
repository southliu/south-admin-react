import type { RangePickerProps } from 'antd/es/date-picker';
import { stringRang2DayjsRang } from '../utils/helper';
import { DatePicker } from 'antd';

const { RangePicker } = DatePicker;

function BaseRangePicker(props: RangePickerProps) {
  const { value } = props;
  const params = { ...props };

  // 如果值不是dayjs类型则进行转换
  if (value) params.value = stringRang2DayjsRang(value);

  return <RangePicker {...params} />;
}

export default BaseRangePicker;
