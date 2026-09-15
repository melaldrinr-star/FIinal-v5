/**
 * LazyChart - Lazy-loaded chart component wrapper
 * 
 * Defers loading of Recharts library until the component is actually visible
 * or becomes interactive. Uses Intersection Observer for visibility detection.
 */

import { lazy, Suspense, useRef, useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';

interface LazyChartProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  props: any;
  height?: number | string;
  fallback?: React.ReactNode;
}

/**
 * ChartSkeleton - Loading placeholder while chart code is being fetched
 */
function ChartSkeleton({ height = 300 }: { height?: number | string }) {
  return (
    <div style={{ height: typeof height === 'number' ? `${height}px` : height }} className="w-full">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

/**
 * LazyChart - Wrapper that lazy-loads chart components
 * 
 * Technique: Uses Intersection Observer to load chart code only when:
 * 1. Component is visible in viewport, OR
 * 2. User scrolls near the component
 * 
 * This defers the large Recharts library from the main bundle.
 */
export function LazyChart({ component: ChartComponent, props, height = 300, fallback }: LazyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create intersection observer to detect when chart is near viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Load chart if visible or within 500px of viewport
        if (entry.isIntersecting || entry.boundingClientRect.top - window.innerHeight < 500) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '500px', // Load 500px before chart enters viewport
      }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ height: typeof height === 'number' ? `${height}px` : height }} className="w-full">
      {shouldLoad ? (
        <Suspense fallback={fallback || <ChartSkeleton height={height} />}>
          <ChartComponent {...props} />
        </Suspense>
      ) : (
        fallback || <ChartSkeleton height={height} />
      )}
    </div>
  );
}

/**
 * Create a lazy-loaded chart component
 * 
 * Usage:
 *   const LazyLineChart = createLazyChart(() => import('./MyChart'));
 *   <LazyLineChart {...chartProps} height={300} />
 */
export function createLazyChart(importFn: () => Promise<{ default: React.ComponentType<any> }>) {
  const LazyComponent = lazy(importFn);
  
  return function RenderLazyChart(props: any) {
    const { height = 300, ...chartProps } = props;
    return <LazyChart component={LazyComponent} props={chartProps} height={height} />;
  };
}

export default LazyChart;
