/**
 * Lazy Loading Utilities
 * 
 * Provides utilities for lazy-loading page components with Suspense boundaries.
 * Includes loading skeleton for better UX during code chunk loading.
 */

import { lazy, Suspense, ReactNode, ComponentType } from 'react';
import { Skeleton } from '../components/ui/skeleton';

/**
 * Loading fallback component - minimal skeleton to show while code is loading
 */
function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 space-y-3">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

/**
 * Wraps a lazily-loaded component with a Suspense boundary
 * @param Component The lazy-loaded component
 * @param fallback Optional custom fallback component (defaults to PageLoadingSkeleton)
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  return function LazyComponent(props: P) {
    return (
      <Suspense fallback={fallback || <PageLoadingSkeleton />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy load a page component
 * @param importFn Dynamic import function
 */
export function lazyPage<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
) {
  const Component = lazy(importFn);
  return withSuspense(Component);
}

/**
 * Lazy load a component
 * @param importFn Dynamic import function
 */
export function lazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
) {
  return lazy(importFn);
}

export { PageLoadingSkeleton };
