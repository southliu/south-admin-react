import { Tooltip } from 'antd';
import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react';

interface EllipsisTextProps {
  text: string;
  width?: number | string;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

const EllipsisText = (props: EllipsisTextProps) => {
  const { width, text, color, className = '', style } = props;
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowed, setIsOverflowed] = useState(false);

  // 计算文本是否溢出
  const calculateOverflow = useCallback(() => {
    const element = textRef.current;
    if (element) {
      // 检查文本是否溢出
      setIsOverflowed(element.scrollWidth > element.clientWidth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, width]);

  useEffect(() => {
    calculateOverflow();
  }, [calculateOverflow]);

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
