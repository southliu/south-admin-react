import type { InitTableState } from '../utils/reducer';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useReducer, useRef, useMemo, memo, useCallback } from 'react';
import { reducer } from '../utils/reducer';
import { isNumber } from '@/utils/is';
import { ScrollContext } from '../utils/state';
import { throttle } from 'lodash';
import VirtualWrapper from '../components/VirtualWrapper';

const initialState: InitTableState = {
  rowHeight: 46, // 行高度
  curScrollTop: 0, // 当前的滚动高度
  scrollHeight: 0, // 可滚动区域的高度
  tableScrollY: 0, // 可滚动区域值
  total: 0, // 数据的总条数
};

type Children = ReactNode &
  Array<{
    props: {
      data: {
        length: number;
      };
    };
  }>;

interface VirtualTableProps {
  style?: CSSProperties;
  children: Children;
}

// 全局配置，用于在 useVirtualTable 和 VirtualTable 之间传递数据
// 注意：这不是最佳实践，但保持与现有架构的兼容性
let scrollY: number | string = 0;

/**
 * 表格渲染
 * @param props - 传递值
 */
const VirtualTable = memo(
  function VirtualTable(props: VirtualTableProps) {
    const { style, children, ...rest } = props;
    const { width, ...restStyle } = style as CSSProperties;
    const [state, dispatch] = useReducer(reducer, initialState);

    const wrapTableRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const totalLen = initialState.total;

    // table总高度
    const tableHeight = useMemo<string | number>(() => {
      // 数据的总条数
      let temp: string | number = 'auto';
      if (state.rowHeight && totalLen) {
        temp = state.rowHeight * (totalLen + 1);
      }
      return temp;
    }, [state.rowHeight, totalLen]);

    // table的scrollY值
    let tableScrollY = 0;
    if (typeof scrollY === 'string') {
      tableScrollY = (wrapTableRef.current?.parentNode as HTMLElement)?.offsetHeight;
    } else {
      tableScrollY = scrollY;
    }

    if (isNumber(tableHeight) && Number(tableHeight) < tableScrollY) {
      tableScrollY = tableHeight as number;
    }

    // 处理tableScrollY小于0的情况
    if (tableScrollY <= 0) tableScrollY = 0;

    // 渲染的条数
    const renderLen = useMemo<number>(() => {
      let temp = 1;
      if (state.rowHeight && totalLen && tableScrollY) {
        if (tableScrollY <= 0) {
          temp = 0;
        } else {
          const tempRenderLen = ((tableScrollY / state.rowHeight) | 0) + 5;
          temp = tempRenderLen > totalLen ? totalLen : tempRenderLen;
        }
      }
      return temp;
    }, [state.rowHeight, totalLen, tableScrollY]);

    // 渲染中的第一条
    let start = state.rowHeight ? (state.curScrollTop / state.rowHeight) | 0 : 0;
    // 偏移量
    let offsetStart = state.rowHeight ? state.curScrollTop % state.rowHeight : 0;

    // 用来优化向上滚动出现的空白
    if (state.curScrollTop && state.rowHeight && state.curScrollTop > state.rowHeight) {
      if (start > totalLen - renderLen) {
        // 可能以后会做点操作
        offsetStart = 0;
      } else if (start > 1) {
        start = start - 1;
        offsetStart += state.rowHeight;
      }
    } else {
      start = 0;
    }

    useEffect(() => {
      // totalLen变化, 那么搜索条件一定变化, 数据也一定变化.
      const parentNode = wrapTableRef.current?.parentNode as HTMLElement;
      if (parentNode) {
        parentNode.scrollTop = 0;
      }
      dispatch({ type: 'reset' });
    }, [totalLen]);

    /** 滑动节流 */
    const throttleScroll = useCallback(
      throttle((e: Event) => {
        const scrollTop: number = (e?.target as HTMLElement)?.scrollTop ?? 0;

        if (scrollTop !== state.curScrollTop) {
          const scrollHeight = (e?.target as HTMLElement)?.scrollHeight - tableScrollY;
          dispatch({
            type: 'changeScroll',
            curScrollTop: scrollTop,
            scrollHeight,
            tableScrollY,
          });
        }
      }, 60),
      [state.curScrollTop, tableScrollY],
    );

    useEffect(() => {
      const ref = wrapTableRef?.current?.parentNode as HTMLElement;

      if (ref) {
        const wrappedThrottle = (e: Event) => throttleScroll(e);
        ref.addEventListener('scroll', wrappedThrottle);

        return () => {
          ref.removeEventListener('scroll', wrappedThrottle);
          throttleScroll.cancel();
        };
      }
    }, [wrapTableRef, throttleScroll]);

    return (
      <div
        className="virtualTable"
        ref={wrapTableRef}
        style={{
          width: '100%',
          position: 'relative',
          height: tableHeight,
          boxSizing: 'border-box',
          paddingTop: state.curScrollTop,
        }}
      >
        <ScrollContext.Provider
          value={{
            dispatch,
            rowHeight: state.rowHeight,
            start,
            offsetStart,
            renderLen,
            totalLen,
          }}
        >
          <table
            {...rest}
            ref={tableRef}
            style={{
              ...restStyle,
              width,
              position: 'relative',
            }}
          >
            {children}
          </table>
        </ScrollContext.Provider>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.style === nextProps.style;
  },
);

interface Props {
  height: number | string;
  rowHeight: number;
  total: number;
}

export default function useVirtualTable(props: Props) {
  const { height, rowHeight, total } = props;
  scrollY = height;
  initialState.rowHeight = rowHeight;
  initialState.total = total;

  return {
    table: VirtualTable,
    body: {
      wrapper: VirtualWrapper,
    },
  };
}
