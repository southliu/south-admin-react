import type { CSSProperties, ReactNode, Ref } from 'react';
import type { BaseFormData, BaseFormList } from '#/form';
import type { ColProps, FormInstance } from 'antd';
import { forwardRef, useEffect } from 'react';
import { FormProps } from 'antd';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { getComponent } from './utils/componentMap';
import { filterEmptyStr, filterFormItem, handleValuePropName } from './utils/helper';
import { filterDayjs } from '../Dates/utils/helper';

interface Props extends FormProps {
  list: BaseFormList[];
  data: BaseFormData;
  form: FormInstance<object>;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
  labelCol?: Partial<ColProps>;
  wrapperCol?: Partial<ColProps>;
  handleFinish: FormProps['onFinish'];
}

const BaseForm = forwardRef((props: Props, ref: Ref<FormInstance>) => {
  const { list, data, form, style, className, children, labelCol, wrapperCol, handleFinish } =
    props;
  const { t } = useTranslation();

  // 清除多余参数
  const formProps: Partial<Props> = { ...props };
  delete formProps.list;
  delete formProps.data;
  delete formProps.handleFinish;

  // 监听传入表单数据，如果变化则替换表单
  useEffect(() => {
    form?.resetFields();
    form?.setFieldsValue(props.data);
  }, [form, props.data]);

  const validateMessages = {
    required: t('public.requiredForm', { label: '${label}' }),
    types: {
      email: t('public.validateEmail', { label: '${label}' }),
      number: t('public.validateNumber', { label: '${label}' }),
    },
    number: {
      range: t('public.validateRange', { label: '${label}', max: '${max}', min: '${min}' }),
    },
  };

  /**
   * 提交表单
   * @param values - 表单值
   */
  const onFinish: FormProps['onFinish'] = (values) => {
    if (handleFinish) {
      // 将dayjs类型转为字符串
      let params = filterDayjs(values, list);
      // 过滤空字符串和前后空格
      params = filterEmptyStr(params);
      handleFinish?.(params);
    }
  };

  /**
   * 表单提交失败处理
   * @param errorInfo - 错误信息
   */
  const onFinishFailed: FormProps['onFinishFailed'] = (errorInfo) => {
    console.warn('表单错误:', errorInfo);
  };

  /**
   * 渲染表单项
   * @param item - 表单项
   */
  const renderFormItem = (item: BaseFormList) => (
    <Form.Item {...filterFormItem(item)} valuePropName={handleValuePropName(item.component)}>
      {getComponent(t, item, form)}
    </Form.Item>
  );

  return (
    <div className={className} style={style}>
      <Form
        {...formProps}
        ref={ref}
        form={form}
        labelCol={labelCol ? labelCol : { span: 6 }}
        wrapperCol={wrapperCol ? wrapperCol : { span: 18 }}
        initialValues={data}
        validateMessages={validateMessages}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        {list?.map((item) => (
          <div key={`${item.name}`}>
            {!item?.unit && <>{renderFormItem(item)}</>}

            {item.unit && (
              <Form.Item label={item.label}>
                {renderFormItem({ ...item, noStyle: true })}
                <span className="ml-5px whitespace-nowrap">{item.unit}</span>
              </Form.Item>
            )}
          </div>
        ))}

        {children}
      </Form>
    </div>
  );
});

export default BaseForm;
