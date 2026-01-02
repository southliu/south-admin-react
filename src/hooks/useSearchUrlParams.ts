/**
 * 将搜索参数带入url中
 */
import { type FormInstance } from "antd";
import { getUrlAllParam } from "@/utils/helper";

export const useSearchUrlParams = (form: FormInstance) => {
  const [, setSearchParams] = useSearchParams();
  const { pathname, search } = useLocation();
  const { setTabs } = useTabsStore((state) => state);

  useEffect(() => {
    handleSetSearchForm();
  }, []);

  /** url参数带入搜索表单中 */
  const handleSetSearchForm = () => {
    const urlParams = getUrlAllParam(search);
    form?.setFieldsValue({
      ...form?.getFieldsValue(),
      ...urlParams
    })
  }

  /** 将搜索参数带入url中 */
  const handleSetSearchParams = (searchParams: BaseFormData) => {
    // 去除 values 中值为 undefined 的属性
    const filteredValues = Object.fromEntries(
      Object.entries(searchParams).filter(([, value]) => value !== undefined),
    ) as Record<string, string>;

    // 将对象转换为 url 参数字符串
    let urlParams = new URLSearchParams(filteredValues).toString();
    if (urlParams?.length) {
      urlParams = `?${urlParams}`;
    }

    setSearchParams(filteredValues);
    setTabs(pathname, urlParams);
  };

  return [handleSetSearchParams];
};
