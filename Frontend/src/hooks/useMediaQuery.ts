import { useEffect, useState } from 'react';

/**
 * Hook to detect if a media query matches
 * Useful for responsive behavior that adapts based on viewport size or other media features
 *
 * @param query - CSS media query string (e.g., '(min-width: 1024px)')
 * @returns boolean - true if the media query matches, false otherwise
 *
 * Example usage:
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 * const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Create media query list
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Define listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener for changes
    mediaQuery.addEventListener('change', listener);

    // Cleanup listener on unmount
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}

/**
 * Common breakpoint queries for responsive design
 */
export const breakpoints = {
  mobile: '(max-width: 639px)',
  mobileLandscape: '(min-width: 640px) and (max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  wide: '(min-width: 1280px)',
  ultraWide: '(min-width: 1536px)',
};
