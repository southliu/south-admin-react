import { AES, Utf8, MD5 } from 'crypto-es';

/** @description: 加密/解密封装，secret值建议从后台接口获取 */
const secretKey = '__Vite_Admin_Secret__';

/**
 * 加密
 * @param data - 加密数据
 * @param secret - 加密密钥
 */
export function encryption(data: object, secret: string = secretKey) {
  const code = JSON.stringify(data);
  return AES.encrypt(code, secret).toString();
}

/**
 * 解密
 * @param data - 解密数据
 * @param secret - 解密密钥
 */
export function decryption(data: string, secret: string = secretKey) {
  const bytes = AES.decrypt(data, secret);
  const originalText = bytes.toString(Utf8);
  if (originalText) {
    return JSON.parse(originalText);
  }
  return null;
}

/**
 * md5加密
 * @param data - 加密数据
 */
export function encryptMd5(data: string) {
  return MD5(data).toString();
}
