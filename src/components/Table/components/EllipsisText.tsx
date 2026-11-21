import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Tooltip } from 'antd';

interface EllipsisTextProps {
  text: string;
  width?: number | string;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

const EllipsisText = (props: EllipsisTextProps) => {
  const { width, text, color, className = '', style } = props;
  const [isOverflowed, setIsOverflowed] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;
    const measure = () => setIsOverflowed(element.scrollWidth > element.clientWidth);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const frame = requestAnimationFrame(measure);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, width]);

  const textStyle = {
    color,
    ...style,
  };

  const content = (
    <span
      ref={textRef}
      className={`inline-block w-full overflow-hidden text-ellipsis whitespace-nowrap ${className}`}
      style={textStyle}
    >
      {text}
    </span>
  );

  // 只有在文本溢出时才显示Tooltip
  if (isOverflowed) {
    return (
      <Tooltip title={text} placement="top">
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default EllipsisText;
