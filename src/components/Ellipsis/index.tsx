import { Tooltip } from 'antd';

/**
 * 文字超出省略组件
 */

interface Props {
  tooltip?: boolean; // 移动到文本展示完整内容的提示
  length?: number; // 在按照长度截取下的文本最大字符数，超过则截取省略
  lines?: number; // 在按照行数截取下最大的行数，超过则截取省略
  fullWidthRecognition?: boolean; // 是否将全角字符的长度视为 2 来计算字符串长度
  children: string;
}

function Ellipsis(props: Props) {
  const { tooltip, length, lines, fullWidthRecognition, children } = props;
  /**
   * 计算全角数量
   * @param str
   * @param len
   * @returns
   */
  const countFullWidthChars = (str: string, len: number) => {
    let count = 0,
      result = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      // 判断是否为全角字符（这里只判断了基本的中文字符范围，如果需要更精确的判断，可以扩展范围）
      if (charCode >= 0x4e00 && charCode <= 0x9fa5) {
        count += 2;
      } else {
        count += 1;
      }

      if (count > len) return result + '...';
      result += str[i];
      if (count === len) {
        return result + '...';
      }
    }
    return result;
  };

  const content =
    length && length > 0
      ? fullWidthRecognition
        ? countFullWidthChars(children, length)
        : children.length > length
          ? children.slice(0, length) + '...'
          : children
      : children;

  const renderContent = (
    <div className="inline-block">
      <span
        className="line-clamp-1"
        style={{
          lineClamp: lines || 1,
          WebkitLineClamp: lines || 1,
        }}
      >
        {content}
      </span>
    </div>
  );

  return (
    <>
      {tooltip && <Tooltip title={children}>{renderContent}</Tooltip>}
      {!tooltip && <>{renderContent}</>}
    </>
  );
}

export default Ellipsis;
