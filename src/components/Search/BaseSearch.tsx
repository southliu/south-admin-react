import type { ColProps, FormInstance } from 'antd';
import type { BaseFormData, BaseSearchList } from '#/form';
import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  forwardRef,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { type FormProps, Button, Col, Flex } from 'antd';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { filterDayjs } from '@/components/Dates';
import { useCommonStore } from '@/hooks/useCommonStore';
import { getComponent } from '@/components/Form/utils/componentMap';
import { SearchOutlined, ReloadOutlined, DownOutlined } from '@ant-design/icons';
import {
  filterEmptyStr,
  filterFormItem,
  handleValuePropName,
} from '@/components/Form/utils/helper';

interface Props extends FormProps {
  list: BaseSearchList[];
  data: BaseFormData;
  isLoading?: boolean;
  isSearch?: boolean;
  isReset?: boolean;
  style?: CSSProperties;
  className?: string;
  type?: 'default' | 'grid';
  children?: ReactNode;
  labelCol?: Partial<ColProps>;
  wrapperCol?: Partial<ColProps>;
  isRowExpand?: boolean; // 是否显示收缩搜索功能
  defaultColCount?: number; // 默认每项占位几个，默认一行四个
  defaultRowExpand?: number; // 默认展示多少行
  handleFinish: FormProps['onFinish'];
}

const BaseSearch = forwardRef((props: Props, ref: Ref<FormInstance>) => {
  const {
    list,
    data,
    initialValues,
    isLoading,
    isSearch = true,
    isReset = true,
    isRowExpand = true,
    type = 'default',
    style,
    className,
    children,
    labelCol,
    wrapperCol,
    defaultColCount = 4,
    defaultRowExpand = 2,
    handleFinish,
  } = props;
  const { t } = useTranslation();
  const { isPhone } = useCommonStore();
  const [form] = Form.useForm();
  const [isExpand, setExpand] = useState(false);
  const [isFirst, setFirst] = useState(true);

  // 是否展示展开按钮
  const isShowExpand = useMemo(() => {
    if (!isRowExpand) return false;

    const showNum = defaultColCount * defaultRowExpand;
    return showNum < list.length;
  }, [defaultColCount, defaultRowExpand, isRowExpand, list.length]);

  // 初始化内容
  useEffect(() => {
    try {
      if (Object.keys(data).length && isFirst) {
        setFirst(false);
        form.setFieldsValue({ ...data });
      }
    } catch (e) {
      console.error(e);
      console.warn('传入的搜索数据不是一个对象');
    }
  }, [data, form, isFirst]);

  // 清除多余参数
  const formProps = { ...props };
  delete formProps.type;
  delete formProps.isSearch;
  delete formProps.isReset;
  delete formProps.isLoading;
  delete formProps.handleFinish;

  /** 点击重置 */
  const onReset = () => {
    form?.resetFields();
    form?.setFieldsValue(initialValues ? { ...initialValues } : {});
    form?.submit();
  };

  /** 获取搜索按钮flex状态 */
  const getFlexCol = () => {
    // 如果搜索按钮在最后一行第一个，则靠右显示
    if (list?.length % defaultColCount === 0) {
      return 'auto';
    }

    return isShowExpand ? 'auto' : undefined;
  };

  /**
   * 处理列表
   * @param list - 列表
   */
  const filterList = (list: BaseSearchList[]) => {
    if (!isShowExpand) return list;

    // 默认显示个数
    const showNum = defaultColCount * defaultRowExpand;

    for (let i = 0; i < list.length; i++) {
      const item = list[i];

      if (i < showNum) {
        item.hidden = false;
        continue;
      }

      item.hidden = !isExpand;
    }

    return list;
  };

  /** 获取表单label宽度 */
  const getLabelCol = (item?: BaseSearchList) => {
    if (item?.labelWidth) {
      return { style: { width: item.labelWidth } };
    }

    if (item?.labelCol) return item.labelCol;
    if (labelCol) return labelCol;

    return type === 'grid' && !isPhone ? { span: 6 } : undefined;
  };

  /** 获取输入间隙 */
  const getWrapperCol = (item?: BaseSearchList) => {
    if (item?.wrapperWidth) {
      return { style: { width: item.wrapperWidth } };
    }

    if (item?.wrapperCol) return item.wrapperCol;
    if (wrapperCol) return wrapperCol;

    return type === 'grid' && !isPhone ? { span: 18 } : undefined;
  };

  /**
   * 提交表单
   * @param values - 表单值
   */
  const onFinish: FormProps['onFinish'] = (values) => {
    if (handleFinish) {
      // 将dayjs类型转为字符串
      let params = filterDayjs(values, list as BaseFormList[]);
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
    console.warn('搜索错误:', errorInfo);
  };

  /** 渲染按钮列表 */
  const renderBtnList = (
    <div className="flex items-center flex-wrap gap-10px">
      {!!isSearch && (
        <Button
          type="primary"
          htmlType="submit"
          className={`!mb-5px ${isPhone ? 'mr-5px' : ''}`}
          loading={isLoading}
          icon={<SearchOutlined />}
        >
          {t('public.search')}
        </Button>
      )}

      {!!isReset && (
        <Button
          className={`!mb-5px ${isPhone ? 'mr-5px' : ''}`}
          icon={<ReloadOutlined />}
          onClick={onReset}
        >
          {t('public.reset')}
        </Button>
      )}

      {children && <div className={`!mb-5px ${isPhone ? 'mr-5px' : ''}`}>{children}</div>}

      {type === 'grid' && !!isShowExpand && (
        <div
          className="text-12px cursor-pointer color-#1677ff hover:color-#69b1ff"
          onClick={() => {
            setExpand(!isExpand);
          }}
        >
          <DownOutlined rotate={isExpand ? 180 : 0} />
          {isExpand ? '收缩' : '展开'}
        </div>
      )}
    </div>
  );

  return (
    <div id="searches" style={style} className={className}>
      <Form
        layout={isPhone ? 'horizontal' : 'inline'}
        {...formProps}
        ref={ref}
        form={form}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        {type === 'default' && (
          <>
            {list?.map((item) => (
              <Form.Item
                {...filterFormItem(item)}
                key={`${item.name}`}
                className={`${item?.className || ''} !mb-5px`}
                labelCol={getLabelCol(item)}
                wrapperCol={getWrapperCol(item)}
                valuePropName={handleValuePropName(item.component)}
              >
                {getComponent(t, item)}
              </Form.Item>
            ))}
            {renderBtnList}
          </>
        )}

        {type === 'grid' && (
          <Flex wrap className="w-full">
            {filterList(list)?.map((item) => (
              <div
                key={`${item.name}`}
                style={{ width: item.hidden ? 0 : `${100 / (isPhone ? 1 : defaultColCount)}%` }}
              >
                <Form.Item
                  {...filterFormItem(item)}
                  className={`${item?.className || ''} !mb-5px`}
                  labelCol={getLabelCol(item)}
                  wrapperCol={getWrapperCol(item)}
                  valuePropName={handleValuePropName(item.component)}
                >
                  {getComponent(t, item)}
                </Form.Item>
              </div>
            ))}

            <Col flex={getFlexCol()}>
              <Flex justify="flex-end">{renderBtnList}</Flex>
            </Col>
          </Flex>
        )}
      </Form>
    </div>
  );
});

export default BaseSearch;
