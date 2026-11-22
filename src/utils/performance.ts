import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

/** 性能指标接口 */
export interface PerformanceMetrics {
  // Cumulative Layout Shift - 累积布局偏移
  cls?: number;
  // First Contentful Paint - 首次内容绘制
  fcp?: number;
  // Interaction to Next Paint - 交互到下一次绘制
  inp?: number;
  // Largest Contentful Paint - 最大内容绘制
  lcp?: number;
  // Time to First Byte - 首字节时间
  ttfb?: number;
}

/** 性能监控类 */
class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private isInitialized = false;

  /** 初始化性能监控 */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    this.isInitialized = true;

    // 监听各项性能指标
    onCLS((metric: Metric) => this.handleMetric('cls', metric));
    onFCP((metric: Metric) => this.handleMetric('fcp', metric));
    onINP((metric: Metric) => this.handleMetric('inp', metric));
    onLCP((metric: Metric) => this.handleMetric('lcp', metric));
    onTTFB((metric: Metric) => this.handleMetric('ttfb', metric));
  }

  /**
   * 处理性能指标
   * @param name - 性能指标名称，用于定位记录项和评级阈值
   * @param metric - 采集到的性能指标数据，用于记录数值和评估等级
   */
  private handleMetric(name: keyof PerformanceMetrics, metric: Metric): void {
    const value = metric.value;
    this.metrics[name] = value;

    // 在开发环境打印到控制台
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name.toUpperCase()}:`, value, metric);

      // 评估性能等级
      this.logPerformanceRating(name, value);
    }
  }

  /**
   * 评估性能等级并输出
   * @param name - 性能指标名称，用于选择对应的评级阈值
   * @param value - 性能指标数值，用于与评级阈值比较
   */
  private logPerformanceRating(name: keyof PerformanceMetrics, value: number): void {
    const ratings = this.getRating(name, value);
    const emoji = ratings === 'good' ? '✅' : ratings === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} ${name.toUpperCase()} Rating: ${ratings}`);
  }

  /**
   * 获取性能评级
   * @param name - 性能指标名称，用于选择对应的评级阈值
   * @param value - 性能指标数值，用于与评级阈值比较
   */
  private getRating(name: keyof PerformanceMetrics, value: number): string {
    const thresholds: Record<string, { good: number; poor: number }> = {
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      inp: { good: 200, poor: 500 },
      lcp: { good: 2500, poor: 4000 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /** 获取所有性能指标 */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /** 获取性能评分报告 */
  getReport(): string {
    const metrics = this.getMetrics();
    let report = '\n📊 性能监控报告\n';

    Object.entries(metrics).forEach(([name, value]) => {
      const rating = this.getRating(name as keyof PerformanceMetrics, value ?? 0);
      const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
      report += `${emoji} ${name.toUpperCase()}: ${value?.toFixed(2)}ms (${rating})\n`;
    });

    return report;
  }

  /**
   * 测量自定义性能
   * @param markName - 性能测量名称，用于标识本次测量结果
   * @param startMarkName - 起始性能标记名称，用于确定测量起点
   * @param endMarkName - 结束性能标记名称，用于确定测量终点
   */
  measure(markName: string, startMarkName: string, endMarkName: string): number | null {
    if (typeof window === 'undefined' || !window.performance) {
      return null;
    }

    try {
      performance.measure(markName, startMarkName, endMarkName);
      const measure = performance.getEntriesByName(markName)[0];
      return measure?.duration || null;
    } catch (error) {
      console.error('Performance measure failed:', error);
      return null;
    }
  }

  /**
   * 创建性能标记
   * @param name - 性能标记名称，用于标识测量的时间点
   */
  mark(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(name);
    }
  }

  /**
   * 清除性能标记和测量
   * @param name - 需要清理的标记名称，省略时清除全部性能标记
   */
  clearMarks(name?: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      if (name) {
        performance.clearMarks(name);
        performance.clearMeasures(name);
      } else {
        performance.clearMarks();
        performance.clearMeasures();
      }
    }
  }
}

// 创建单例
const performanceMonitor = new PerformanceMonitor();

/** 初始化性能监控 */
export function initPerformanceMonitoring(): void {
  performanceMonitor.init();
}

/** 获取性能指标 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return performanceMonitor.getMetrics();
}

/** 获取性能报告 */
export function getPerformanceReport(): string {
  return performanceMonitor.getReport();
}

/**
 * 测量性能
 * @param markName - 性能测量名称，用于标识本次测量结果
 * @param startMark - 起始性能标记名称，用于确定测量起点
 * @param endMark - 结束性能标记名称，用于确定测量终点
 */
export function measurePerformance(markName: string, startMark: string, endMark: string): number | null {
  return performanceMonitor.measure(markName, startMark, endMark);
}

/**
 * 创建性能标记
 * @param name - 性能标记名称，用于标识测量的时间点
 */
export function createMark(name: string): void {
  performanceMonitor.mark(name);
}

/**
 * 清除性能标记
 * @param name - 需要清理的标记名称，省略时清除全部性能标记
 */
export function clearMarks(name?: string): void {
  performanceMonitor.clearMarks(name);
}

/**
 * 性能装饰器 - 用于测量函数执行时间
 * @param _target - 被装饰的目标对象，为兼容方法装饰器签名而保留
 * @param propertyKey - 被装饰的方法名，用于生成性能测量标识
 * @param descriptor - 方法属性描述符，用于包装原方法并记录耗时
 */
export function measureFunctionTime(
  _target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const startMark = `${propertyKey}-start`;
    const endMark = `${propertyKey}-end`;
    const measureName = `${propertyKey}-duration`;

    createMark(startMark);

    try {
      const result = await originalMethod.apply(this, args);
      createMark(endMark);

      const duration = measurePerformance(measureName, startMark, endMark);
      if (duration !== null && process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${propertyKey} took ${duration.toFixed(2)}ms`);
      }

      clearMarks(startMark);
      clearMarks(endMark);
      clearMarks(measureName);

      return result;
    } catch (error) {
      createMark(endMark);
      const duration = measurePerformance(measureName, startMark, endMark);
      if (duration !== null && process.env.NODE_ENV === 'development') {
        console.error(`❌ ${propertyKey} failed after ${duration.toFixed(2)}ms`, error);
      }
      clearMarks(startMark);
      clearMarks(endMark);
      clearMarks(measureName);
      throw error;
    }
  };
}

export default performanceMonitor;
