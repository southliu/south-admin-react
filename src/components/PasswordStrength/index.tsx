import type { InputProps } from 'antd';
import { USER_LENGTH } from '@/utils/fieldLimits';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Input } from 'antd';
import StrengthBar from './components/StrengthBar';

function getPasswordStrength(value: InputProps['value']): number {
  const password = String(value ?? '');
  let level = 0;
  if (/\d/.test(password)) level++;
  if (/[a-z]/.test(password)) level++;
  if (/[A-Z]/.test(password)) level++;
  if (password.length > 10) level++;
  if (/[\.\~\@\#\$\^\&\*]/.test(password)) level++;
  return level;
}

/**
 * 密码强度组件
 * @param props - 组件配置，用于设置展示内容和交互回调
 */
function PasswordStrength(props: InputProps) {
  const { value } = props;
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(props.defaultValue);
  const isControlled = Object.hasOwn(props, 'value');
  const strength = getPasswordStrength(isControlled ? value : inputValue);

  return (
    <>
      <Input.Password
        maxLength={USER_LENGTH.password}
        value={value}
        allowClear={true}
        placeholder={t('public.inputPleaseEnter')}
        autoComplete="password"
        {...props}
        onChange={(e) => {
          props.onChange?.(e);
          if (!isControlled) setInputValue(e.target.value);
        }}
      />

      {!!strength && <StrengthBar strength={strength} />}
    </>
  );
}

export default PasswordStrength;
