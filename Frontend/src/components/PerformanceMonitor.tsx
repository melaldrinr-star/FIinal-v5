/**
 * Performance Monitor Component
 * 
 * Displays Web Vitals and performance metrics in development mode.
 * Shows LCP, FCP, FID, CLS, and helps identify performance bottlenecks.
 */

import { useState, useEffect } from 'react';
import { performanceLogger } from '../utils/performanceLogger';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function PerformanceMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState(performanceLogger.getAllMetrics());
  const [summary, setSummary] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceLogger.getAllMetrics());
      setSummary(performanceLogger.generateSummary());
    }, 5000);

    setSummary(performanceLogger.generateSummary());

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const latestMetric = metrics[metrics.length - 1];

  if (!latestMetric) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-black/80 text-white px-3 py-2 rounded-lg text-xs font-mono hover:bg-black/90 transition-colors border border-green-500/50"
      >
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Performance Monitor
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {isOpen && (
        <div className="mt-2 bg-black/90 text-green-300 p-3 rounded-lg text-xs font-mono border border-green-500/50 max-h-96 overflow-y-auto shadow-lg">
          <div className="space-y-2">
            {latestMetric.navigationTiming && (
              <>
                <div className="font-bold text-green-400">Navigation Timing:</div>
                <div className="pl-2 space-y-1">
                  <div>
                    DNS: <span className={latestMetric.navigationTiming.dns > 100 ? 'text-yellow-400' : 'text-green-300'}>
                      {latestMetric.navigationTiming.dns.toFixed(2)}ms
                    </span>
                  </div>
                  <div>
                    TCP: <span className={latestMetric.navigationTiming.tcp > 100 ? 'text-yellow-400' : 'text-green-300'}>
                      {latestMetric.navigationTiming.tcp.toFixed(2)}ms
                    </span>
                  </div>
                  <div>
                    TTFB: <span className={latestMetric.navigationTiming.ttfb > 500 ? 'text-red-400' : 'text-green-300'}>
                      {latestMetric.navigationTiming.ttfb.toFixed(2)}ms
                    </span>
                  </div>
                  <div>
                    DOM Interactive: <span className={latestMetric.navigationTiming.domInteractive > 1000 ? 'text-yellow-400' : 'text-green-300'}>
                      {latestMetric.navigationTiming.domInteractive.toFixed(2)}ms
                    </span>
                  </div>
                  <div>
                    Page Load: <span className={latestMetric.navigationTiming.pageLoadTime > 3000 ? 'text-red-400' : latestMetric.navigationTiming.pageLoadTime > 2000 ? 'text-yellow-400' : 'text-green-300'}>
                      {latestMetric.navigationTiming.pageLoadTime.toFixed(2)}ms
                    </span>
                  </div>
                </div>
              </>
            )}

            {latestMetric.vitals && (
              <>
                <div className="font-bold text-green-400 mt-3">Web Vitals:</div>
                <div className="pl-2 space-y-1">
                  {latestMetric.vitals.fcp && (
                    <div>
                      FCP: <span className={latestMetric.vitals.fcp > 1800 ? 'text-red-400' : 'text-green-300'}>
                        {latestMetric.vitals.fcp.toFixed(2)}ms
                      </span>
                    </div>
                  )}
                  {latestMetric.vitals.lcp && (
                    <div>
                      LCP: <span className={latestMetric.vitals.lcp > 2500 ? 'text-red-400' : latestMetric.vitals.lcp > 1800 ? 'text-yellow-400' : 'text-green-300'}>
                        {latestMetric.vitals.lcp.toFixed(2)}ms
                      </span>
                      {latestMetric.vitals.lcp <= 2000 && <span className="ml-2 text-green-400">✓ GOOD</span>}
                    </div>
                  )}
                  {latestMetric.vitals.fid && (
                    <div>
                      FID: <span className={latestMetric.vitals.fid > 100 ? 'text-yellow-400' : 'text-green-300'}>
                        {latestMetric.vitals.fid.toFixed(2)}ms
                      </span>
                    </div>
                  )}
                  {latestMetric.vitals.cls && (
                    <div>
                      CLS: <span className={latestMetric.vitals.cls > 0.1 ? 'text-yellow-400' : 'text-green-300'}>
                        {latestMetric.vitals.cls.toFixed(3)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {latestMetric.resourceTiming && (
              <>
                <div className="font-bold text-green-400 mt-3">Resources:</div>
                <div className="pl-2 space-y-1">
                  <div>JS: {(latestMetric.resourceTiming.jsSize / 1024).toFixed(2)}KB</div>
                  <div>CSS: {(latestMetric.resourceTiming.cssSize / 1024).toFixed(2)}KB</div>
                  <div>Images: {(latestMetric.resourceTiming.imageSize / 1024).toFixed(2)}KB</div>
                  <div>Total: {(latestMetric.resourceTiming.totalSize / 1024).toFixed(2)}KB</div>
                </div>
              </>
            )}

            <div className="font-bold text-green-400 mt-3">
              Page: {latestMetric.pagePath}
            </div>

            <div className="text-green-500 text-[10px] mt-2 border-t border-green-500/30 pt-2">
              Total metrics collected: {metrics.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
