/**
 * Resource Hints Utility
 * 
 * Dynamically adds resource hints based on page context to optimize
 * asset loading priority and reduce critical path length.
 * 
 * Reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel
 */

/**
 * Add DNS prefetch hint for a domain
 * 
 * Use when: Third-party domain might be needed in future navigation
 * Benefit: Resolves DNS ~100-300ms early
 * Overhead: Minimal (~100 bytes)
 */
export function dnsPrefetch(hostname: string): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = `//${hostname}`;
  document.head.appendChild(link);
}

/**
 * Add preconnect hint for a domain
 * 
 * Use when: Domain is highly likely to be used on current page
 * Benefit: Establishes full connection (DNS + TCP + TLS) ~200-500ms early
 * Overhead: Moderate (~1KB per connection)
 * Max: Browser typically supports 4-6 preconnects, don't overuse
 */
export function preconnect(url: string, crossorigin: boolean = false): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  if (crossorigin) {
    link.setAttribute('crossorigin', '');
  }
  document.head.appendChild(link);
}

/**
 * Add prefetch hint for a resource
 * 
 * Use when: Resource might be needed in future navigation (low priority)
 * Benefit: Browser fetches during idle time, improves navigation speed
 * Overhead: Network bandwidth during idle
 * Priority: Very low - used only when browser is not busy
 */
export function prefetch(url: string, as: string = 'script'): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Add preload hint for a resource
 * 
 * Use when: Resource is CRITICAL for current page rendering
 * Benefit: High priority fetch, improves LCP if resource is on critical path
 * Overhead: Can block other resources if overused
 * Priority: High - use sparingly for truly critical resources
 */
export function preload(url: string, as: string, type?: string, media?: string): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  if (type) link.type = type;
  if (media) link.media = media;
  document.head.appendChild(link);
}

/**
 * Add modulepreload hint for ES modules
 * 
 * Use when: Module is imported early and benefits from parallel loading
 * Benefit: Browser can discover and load module dependencies early
 * Overhead: Minimal
 */
export function modulePreload(url: string): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Prefetch next route based on user navigation patterns
 * 
 * Note: Route prefetching is most effective in production builds where
 * Vite has resolved hash-based filenames. In dev mode, Vite handles
 * chunk prefetching automatically via dev server.
 * 
 * Usage: Call after user clicks a link or shows intent (production only)
 * Example: <Link to="/dashboard" onMouseEnter={() => prefetchRoute('/dashboard')} />
 */
export function prefetchRoute(routePath: string): void {
  // Skip in dev mode - Vite dev server handles this
  // Also skip if wildcard patterns can't be resolved
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'development') {
    return;
  }

  // Map routes to their likely chunks (production builds with hashes)
  const routeChunks: Record<string, string[]> = {
    '/dashboard': ['/assets/DashboardPage-*.js'],
    '/trainee/dashboard': ['/assets/TraineeDashboardPage-*.js'],
    '/trainee/attendance': ['/assets/TraineeAttendancePage-*.js'],
    '/programs': ['/assets/ProgramsPage-*.js'],
    '/reports': ['/assets/ReportsPage-*.js', '/assets/chart-lib-*.js'],
  };

  const chunks = routeChunks[routePath];
  if (chunks) {
    chunks.forEach(chunk => prefetch(chunk, 'script'));
  }
}

/**
 * Estimate resource importance based on page context
 * 
 * Returns 'high', 'medium', or 'low' importance
 * Used to decide which resources to preload/prefetch
 */
export function getResourceImportance(resource: string): 'high' | 'medium' | 'low' {
  // High priority: Main bundle, vendor-react
  if (resource.includes('index-') || resource.includes('vendor-react')) {
    return 'high';
  }
  
  // Medium priority: Other vendors, dashboard page
  if (
    resource.includes('vendor-') ||
    resource.includes('DashboardPage') ||
    resource.includes('radix-ui')
  ) {
    return 'medium';
  }
  
  // Low priority: Everything else
  return 'low';
}

/**
 * Performance hints for different network conditions
 * 
 * Note: These use hash-based wildcards that only work in production builds
 * where Vite has resolved the actual filenames. In dev mode, preloading
 * is handled by index.html resource hints instead.
 */
export const networkConditionHints = {
  // Slow 4G: Preload only critical resources
  slow: {
    preload: [], // Skip wildcard preloads in dev/prod - use index.html hints instead
    prefetch: [], // Don't prefetch on slow networks
  },
  // Fast 4G: Preload critical + prefetch secondary
  fast: {
    preload: [], // Skip wildcard preloads in dev/prod - use index.html hints instead
    prefetch: [], // Prefetch handled by index.html in production
  },
  // Wifi: Preload critical + prefetch everything
  wifi: {
    preload: [], // Skip wildcard preloads in dev/prod - use index.html hints instead
    prefetch: [], // Prefetch handled by index.html in production
  },
};

/**
 * Apply resource hints based on network speed
 * 
 * Note: In development mode, wildcard patterns cannot be resolved to actual files.
 * Resource hints are most effective in production builds where Vite has created
 * hash-based filenames. This function gracefully handles both environments.
 * 
 * Requires: navigator.connection API (Chrome, Edge, etc.)
 */
export function applyNetworkAwareHints(): void {
  // In dev mode, skip dynamic preloading - use index.html resource hints instead
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  if (typeof navigator === 'undefined' || !(navigator as any).connection) {
    // Fallback to fast network hints (production only)
    networkConditionHints.fast.preload.forEach(url => preload(url, 'script'));
    networkConditionHints.fast.prefetch.forEach(url => prefetch(url, 'script'));
    return;
  }

  const connection = (navigator as any).connection;
  const effectiveType = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'

  let hints = networkConditionHints.fast;
  if (effectiveType === '3g' || effectiveType === '2g' || effectiveType === 'slow-2g') {
    hints = networkConditionHints.slow;
  } else if (connection.saveData) {
    // User enabled data saver mode
    hints = networkConditionHints.slow;
  }

  hints.preload.forEach(url => preload(url, 'script'));
  hints.prefetch.forEach(url => prefetch(url, 'script'));
}

/**
 * Initialize all resource hints on app start
 */
export function initializeResourceHints(): void {
  if (typeof document === 'undefined') return;

  // Apply network-aware hints
  applyNetworkAwareHints();

  // Listen for connection change
  if ((navigator as any).connection) {
    (navigator as any).connection.addEventListener('change', applyNetworkAwareHints);
  }
}

export default {
  dnsPrefetch,
  preconnect,
  prefetch,
  preload,
  modulePreload,
  prefetchRoute,
  getResourceImportance,
  applyNetworkAwareHints,
  initializeResourceHints,
};
