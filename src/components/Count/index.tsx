import { amountFormatter } from '@/utils/helper';
import { useState, useEffect } from 'react';

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  prefix?: string;
  start: number;
  end: number;
}

function Count(props: Props) {
  const { prefix, start, end, ...spanProps } = props;
  const [num, setNum] = useState(start);
  useEffect(() => {
    let frame: number;
    let startedAt: number | undefined;
    const animate = (timestamp: number) => {
      startedAt ??= timestamp;
      const progress = start === end ? 1 : Math.min((timestamp - startedAt) / 2000, 1);
      setNum(progress === 1 ? end : Math.round(start + (end - start) * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end, start]);

  return (
    <span {...spanProps}>
      {prefix}
      {amountFormatter(num)}
    </span>
  );
}

export default Count;
