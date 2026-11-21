import type { DatePickerProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { string2Dayjs } from '../utils/helper';
import { DatePicker } from 'antd';

function BaseDatePicker(props: DatePickerProps) {
  const { value } = props;
  const params = { ...props };

  // 如果值不是dayjs类型则进行转换
  if (value) params.value = string2Dayjs(value as Dayjs);

  return <DatePicker {...params} />;
}

export default BaseDatePicker;
