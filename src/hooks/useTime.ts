import { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';

/** 获取本地时间 */
export const useTimes = () => {
  const [time, setTime] = useState(dayjs().format('YYYY年MM月DD日 HH:mm:ss'));
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setTime(dayjs().format('YYYY年MM月DD日 HH:mm:ss'));
    }, 1000);

    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, []);

  return {
    time,
  };
};
