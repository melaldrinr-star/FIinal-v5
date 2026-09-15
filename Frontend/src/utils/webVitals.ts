/**
 * Web Vitals Tracking Utility
 * 
 * Measures and tracks Core Web Vitals (LCP, FID, CLS) and other performance metrics.
 * Provides hooks for sending metrics to analytics services or logging to console.
 */

type VitalsMetric = {
  name: string;
  value: number;
  delta?: number;
  id: string;
  entries?: PerformanceEntry[];
  navigationType?: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
};

type VitalsCallback = (metric: VitalsMetric) => void;

// Store callbacks to be called when metrics are available
const callbacks: VitalsCallback[] = [];

/**
 * Register a callback to be invoked when a Web Vital is measured
 */
export function onWebVital(callback: VitalsCallback): () => void {
  callbacks.push(callback);
  return () => {
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  };
}

/**
 * Send a metric to all registered callbacks
 */
function sendMetric(metric: VitalsMetric) {
  callbacks.forEach((callback) => {
    try {
      callback(metric);
    } catch (error) {
      console.error('Error in Web Vitals callback:', error);
    }
  });
}

/**
 * Measure Largest Contentful Paint (LCP)
 * Best practice threshold: < 2.5 seconds
 */
function measureLCP() {
  let lcp: PerformanceEntry | undefined;
  
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
    
    lcp = lastEntry;
    
    // Send LCP metric
    sendMetric({
      name: 'LCP',
      value: lcp.startTime,
      id: `lcp-${Date.now()}`,
      entries: [lcp],
      rating: lcp.startTime < 2500 ? 'good' : lcp.startTime < 4000 ? 'needs-improvement' : 'poor',
    });
  });

  observer.observe({ entryTypes: ['largest-contentful-paint'] });

  // Cleanup after 30s (LCP only happens once per page)
  return () => observer.disconnect();
}

/**
 * Measure First Input Delay (FID)
 * Best practice threshold: < 100 milliseconds
 */
function measureFID() {
  let fid: PerformanceEventTiming | undefined;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries() as PerformanceEventTiming[];
    const firstInput = entries[0];

    fid = firstInput;

    if (fid) {
      const delay = fid.processingStart - fid.startTime;
      sendMetric({
        name: 'FID',
        value: delay,
        delta: delay,
        id: `fid-${Date.now()}`,
        entries: [fid],
        rating: delay < 100 ? 'good' : delay < 300 ? 'needs-improvement' : 'poor',
      });
    }
  });

  observer.observe({ entryTypes: ['first-input'] });

  return () => observer.disconnect();
}

/**
 * Measure Cumulative Layout Shift (CLS)
 * Best practice threshold: < 0.1
 */
function measureCLS() {
  let cls = 0;
  let sessionValue = 0;
  let sessionEntries: PerformanceEntry[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as PerformanceEntry[]) {
      if (!(entry as any).hadRecentInput) {
        // Only count layout shifts without recent user input
        const firstSessionEntry = sessionEntries[0];
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

        if (
          firstSessionEntry &&
          lastSessionEntry &&
          (entry as any).startTime - (lastSessionEntry as any).startTime < 1000
        ) {
          sessionValue += (entry as any).value;
          sessionEntries.push(entry);
        } else {
          // New session
          if (sessionValue > cls) {
            cls = sessionValue;
          }
          sessionValue = (entry as any).value;
          sessionEntries = [entry];
        }
      }
    }
  });

  observer.observe({ entryTypes: ['layout-shift'] });

  // Report CLS periodically
  const interval = setInterval(() => {
    if (sessionValue > cls) {
      cls = sessionValue;
    }
    
    sendMetric({
      name: 'CLS',
      value: cls,
      id: `cls-${Date.now()}`,
      entries: sessionEntries,
      rating: cls < 0.1 ? 'good' : cls < 0.25 ? 'needs-improvement' : 'poor',
    });
  }, 5000);

  return () => {
    clearInterval(interval);
    observer.disconnect();
  };
}

/**
 * Measure First Contentful Paint (FCP)
 * Best practice threshold: < 1.8 seconds
 */
function measureFCP() {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find((entry) => entry.name === 'first-contentful-paint');

      if (fcp) {
        sendMetric({
          name: 'FCP',
          value: fcp.startTime,
          id: `fcp-${Date.now()}`,
          entries: [fcp],
          rating: fcp.startTime < 1800 ? 'good' : fcp.startTime < 3000 ? 'needs-improvement' : 'poor',
        });
      }
    });

    observer.observe({ entryTypes: ['paint'] });
    return () => observer.disconnect();
  }
  return () => {};
}

/**
 * Initialize all Web Vitals measurements
 * Should be called once on app startup
 */
export function initializeWebVitals() {
  if (typeof window === 'undefined') return;

  const cleanups: Array<() => void> = [];

  try {
    cleanups.push(measureLCP());
    cleanups.push(measureFID());
    cleanups.push(measureCLS());
    cleanups.push(measureFCP());
  } catch (error) {
    console.error('Error initializing Web Vitals:', error);
  }

  // Return cleanup function
  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

/**
 * Log Web Vitals to console (useful for development)
 */
export function enableWebVitalsLogging(options?: { prefix?: string; verbose?: boolean }) {
  const prefix = options?.prefix ?? '[Web Vitals]';
  const verbose = options?.verbose ?? false;

  return onWebVital((metric) => {
    const rating = metric.rating ? `(${metric.rating})` : '';
    const value = metric.value.toFixed(2);
    
    if (verbose) {
      console.log(`${prefix} ${metric.name}: ${value}ms ${rating}`, metric);
    } else {
      console.log(`${prefix} ${metric.name}: ${value}ms ${rating}`);
    }
  });
}

/**
 * Create a performance report from collected metrics
 */
export function createPerformanceReport(metrics: VitalsMetric[]): string {
  const report = [
    '═══════════════════════════════════════',
    '       Web Vitals Performance Report',
    '═══════════════════════════════════════',
  ];

  const grouped = metrics.reduce(
    (acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric);
      return acc;
    },
    {} as Record<string, VitalsMetric[]>
  );

  Object.entries(grouped).forEach(([name, values]) => {
    const avg = values.reduce((sum, m) => sum + m.value, 0) / values.length;
    const max = Math.max(...values.map((m) => m.value));
    const min = Math.min(...values.map((m) => m.value));
    const rating = values[values.length - 1]?.rating || 'unknown';

    report.push('');
    report.push(`${name}:`);
    report.push(`  Average: ${avg.toFixed(2)}ms`);
    report.push(`  Min: ${min.toFixed(2)}ms`);
    report.push(`  Max: ${max.toFixed(2)}ms`);
    report.push(`  Rating: ${rating}`);
  });

  report.push('');
  report.push('═══════════════════════════════════════');

  return report.join('\n');
}

export type { VitalsMetric, VitalsCallback };
