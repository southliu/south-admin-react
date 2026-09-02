import { useCallback, useEffect, useRef } from 'react';
import { debounce, isEqual } from 'lodash';
import * as echarts from 'echarts/core';
import {
  BarChart,
  GaugeChart,
  LineChart,
  PictorialBarChart,
  PieChart,
  RadarChart,
  ScatterChart,
} from 'echarts/charts';
import type {
  BarSeriesOption,
  GaugeSeriesOption,
  LineSeriesOption,
  PictorialBarSeriesOption,
  PieSeriesOption,
  RadarSeriesOption,
  ScatterSeriesOption,
} from 'echarts/charts';
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  TransformComponent,
} from 'echarts/components';
import type {
  DatasetComponentOption,
  GridComponentOption,
  LegendComponentOption,
  TitleComponentOption,
  ToolboxComponentOption,
  TooltipComponentOption,
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

export type ECOption = echarts.ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | ScatterSeriesOption
  | PictorialBarSeriesOption
  | RadarSeriesOption
  | GaugeSeriesOption
  | TitleComponentOption
  | LegendComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | ToolboxComponentOption
  | DatasetComponentOption
>;

echarts.use([
  TitleComponent,
  LegendComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  ToolboxComponent,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  PictorialBarChart,
  RadarChart,
  GaugeChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
]);

/**
 * 使用Echarts
 * @param options -  绘制echarts的参数
 * @param data -  数据
 */
export const useEcharts = (options: echarts.EChartsCoreOption, data?: unknown) => {
  const echartsRef = useRef<echarts.EChartsType | null>(null);
  const htmlDivRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const debouncedResizeRef = useRef<ReturnType<typeof debounce> | null>(null);
  const optionsRef = useRef(options);
  const isFirstUpdateRef = useRef(true);
  const lastOptionsRef = useRef(options);
  const lastDataRef = useRef(data);

  /** 销毁echarts */
  const dispose = useCallback(() => {
    if (echartsRef.current) {
      echartsRef.current.dispose();
      echartsRef.current = null;
    }
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    if (debouncedResizeRef.current) {
      debouncedResizeRef.current.cancel();
      debouncedResizeRef.current = null;
    }
  }, []);

  /** 初始化 */
  useEffect(() => {
    if (!htmlDivRef.current || !optionsRef.current) return;

    // 初始化chart
    echartsRef.current = echarts.init(htmlDivRef.current);
    echartsRef.current.setOption(optionsRef.current);

    // 创建并保存 debounced resize 函数
    debouncedResizeRef.current = debounce(() => {
      echartsRef.current?.resize({
        animation: {
          duration: 500,
        },
      });
    }, 50);

    // 使用 ResizeObserver 监听容器尺寸变化
    resizeObserverRef.current = new ResizeObserver(debouncedResizeRef.current);
    resizeObserverRef.current.observe(htmlDivRef.current);

    return () => {
      dispose();
    };
  }, [dispose]);

  // 当数据变化时更新图表
  useEffect(() => {
    if (isFirstUpdateRef.current) {
      isFirstUpdateRef.current = false;
    } else if (!isEqual(options, lastOptionsRef.current) || !isEqual(data, lastDataRef.current)) {
      // 调用方每次 render 都会新建 options 对象，必须按内容比较：
      // 内容没变不调 setOption（图表完全不动），内容变了恰好更新一次
      echartsRef.current?.setOption(options);
    }

    lastOptionsRef.current = options;
    lastDataRef.current = data;
  }, [data, options]);

  return [htmlDivRef, echartsRef] as const;
};
