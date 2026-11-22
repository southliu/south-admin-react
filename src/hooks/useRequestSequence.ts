import { useCallback, useEffect, useRef } from 'react';

/** 每次加载只允许最新请求更新状态，关闭或卸载时使旧响应失效。 */
export function useRequestSequence() {
  const sequence = useRef(0);
  const invalidate = useCallback(() => {
    sequence.current += 1;
  }, []);
  const begin = useCallback(() => {
    const current = ++sequence.current;
    return () => current === sequence.current;
  }, []);

  useEffect(() => invalidate, [invalidate]);

  return { begin, invalidate };
}
