import type { Dayjs } from 'dayjs';
import type { DatePickerProps } from 'antd';
import type { BaseFormData, BaseFormList } from '#/form';
import type { RangeValueType } from 'rc-picker/lib/PickerInput/RangePicker';
import { DATE_FORMAT } from '@/utils/config';
import dayjs from 'dayjs';

/**
 * @description isDayjs必须使用dayjs.isDayjs形式，否则打包会失败
 */

// 区间值
type EventValue<T> = T | null;
export type RangeValue<T> = [EventValue<T>, EventValue<T>] | null;

/**
 * dayjs类型转字符串类型
 * @param value - dayjs时间类型值
 */
export function dayjs2String(value: Dayjs | string, format = DATE_FORMAT): string {
  if (dayjs.isDayjs(value)) {
    return value.format(format);
  }
  return value;
}

/**
 * 字符串类型转dayjs类型
 * @param value - 字符串
 */
export function string2Dayjs(value: Dayjs | string | number): Dayjs {
  if (dayjs.isDayjs(value)) {
    return value;
  }

  // 如果是时间戳
  if (typeof value === 'number' && isFinite(value)) {
    return dayjs.unix(value);
  }

  return dayjs(value);
}

/**
 * dayjs数组类型转字符串类型
 * @param value - dayjs时间类型值
 */
export function dayjsRang2StringRang(value: RangeValue<Dayjs>, format = DATE_FORMAT) {
  if (!value) return undefined;

  if (value?.length > 1 && dayjs.isDayjs(value?.[0]) && dayjs.isDayjs(value?.[1])) {
    return [value[0].format(format), value[1].format(format)];
  }
  return value;
}

/**
 * 字符串类型转dayjs类型
 * @param value - 字符串
 */
export function stringRang2DayjsRang(
  value: RangeValueType<string | number> | RangeValueType<Dayjs>,
): RangeValue<Dayjs> | undefined {
  if (!value) return undefined;

  // 当第一个数据都不为Dayjs
  if (value?.length > 1 && !dayjs.isDayjs(value?.[0]) && dayjs.isDayjs(value?.[1])) {
    // 判断是否是时间戳
    if (typeof value[0] === 'number' && isFinite(value[0])) {
      return [dayjs.unix(value[0]), value[1]];
    }

    return [dayjs(value[0]), value[1]];
  }

  // 当最后一个数据都不为Dayjs
  if (value?.length > 1 && dayjs.isDayjs(value?.[0]) && !dayjs.isDayjs(value?.[1])) {
    // 判断是否是时间戳
    if (typeof value[1] === 'number' && isFinite(value[1])) {
      return [value[0], dayjs.unix(value[1])];
    }

    return [value[0], dayjs(value[1])];
  }

  // 当两个数据都不为Dayjs
  if (value?.length > 1 && !dayjs.isDayjs(value?.[0]) && !dayjs.isDayjs(value?.[1])) {
    // 判断是否是时间戳
    if (
      typeof value[0] === 'number' &&
      isFinite(value[0]) &&
      typeof value[1] === 'number' &&
      isFinite(value[1])
    ) {
      return [dayjs.unix(value[0]), dayjs.unix(value[1])];
    }

    return [dayjs(value[0]), dayjs(value[1])];
  }
  return value as RangeValue<Dayjs>;
}

/**
 * 获取列表中改键值数据
 * @param list - 列表值
 * @param key - 键值
 */
function getListKeyParam(list: BaseFormList[], key: string): string {
  for (let i = 0; i < list.length; i++) {
    if (list[i].name === key) {
      return ((list[i].componentProps as DatePickerProps)?.format as string) || DATE_FORMAT;
    }
  }

  return DATE_FORMAT;
}

/**
 * 将Dayjs转为字符串
 * @param obj - 检测对象
 * @param list - 列表值
 */
export function filterDayjs(obj: BaseFormData, list: BaseFormList[]): Record<string, unknown> {
  // 获取自定义组件的key
  const customizeList = list
    .filter((item) => item.component === 'customize')
    .map((item) => item.name);

  for (const key in obj) {
    // 自定义组件不处理
    if (customizeList?.includes(key)) continue;

    // 判断是否是时间区间
    if (
      (obj[key] as [Dayjs, Dayjs])?.length === 2 &&
      dayjs.isDayjs((obj[key] as [Dayjs, Dayjs])[0]) &&
      dayjs.isDayjs((obj[key] as [Dayjs, Dayjs])[1])
    ) {
      const format = getListKeyParam(list, key);
      obj[key] = dayjsRang2StringRang(obj[key] as [Dayjs, Dayjs], format);
    }

    // 如果是Dayjs类型则转换成字符串
    if (obj?.[key] && dayjs.isDayjs(obj[key])) {
      const format = getListKeyParam(list, key);
      obj[key] = dayjs2String(obj[key] as Dayjs, format);
    }
  }

  return obj;
}
