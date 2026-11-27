import { createLoader } from './helpers/load-module.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';

test('crypto-es 读取旧 CryptoJS AES 缓存并保持 MD5 协议', () => {
  const { encryption, decryption, encryptMd5 } = createLoader()('packages/utils/src/crypto.ts');
  const key = 'migration-test-key';
  const legacy = 'U2FsdGVkX19m1V921t8kyEGzMoNtfQm2T9pQ+FGlvmEqwVgp8L5IPbb+nWErce95VmNDsaXBKtPQMHIpQQtn9g==';
  assert.deepEqual(decryption(legacy, key), { value: 'old-token', expire: 0 });
  const data = { value: '中文缓存', expire: null };
  assert.deepEqual(decryption(encryption(data, key), key), data);
  assert.equal(encryptMd5('abc'), '900150983cd24fb0d6963f7d28e17f72');
});
