import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  convertCustomizationsToCSSVariables,
  generateCSSString,
} from '../../utils/cssVariableConverter';
import {
  injectCSSVariables,
  getInjectedCSS,
  validateCSSInjection,
} from '../../utils/cssInjection';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

export interface PreviewPanelProps {
  customizations: Record<string, any>;
  debounceMs?: number;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

/**
 * PreviewPanel Component
 * Displays landing page with live CSS variable injection
 * Shows sample/placeholder content with real-time customization updates
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2
 */
export default function PreviewPanel({
  customizations,
  debounceMs = 300,
  onError,
  onSuccess,
}: PreviewPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderTime, setRenderTime] = useState<number>(0);
  const [injectionTime, setInjectionTime] = useState<number>(0);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Convert customizations to CSS variables
  const cssVariables = useMemo(() => {
    return convertCustomizationsToCSSVariables(customizations);
  }, [customizations]);

  // Generate CSS string
  const cssString = useMemo(() => {
    return generateCSSString(cssVariables);
  }, [cssVariables]);

  // Inject CSS with debouncing
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set loading state
    setIsLoading(true);
    setError(null);

    // Debounce CSS injection
    const timer = setTimeout(() => {
      try {
        const startTime = performance.now();

        // Inject CSS variables
        const result = injectCSSVariables(cssString, {
          id: 'cms-preview-styles',
          onSuccess: () => {
            const endTime = performance.now();
            setInjectionTime(Math.round(endTime - startTime));

            // Validate injection
            const validation = validateCSSInjection('cms-preview-styles');
            if (!validation.isValid) {
              throw new Error(validation.message);
            }

            setIsLoading(false);
            if (onSuccess) onSuccess();
          },
          onError: (err) => {
            setError(err.message);
            setIsLoading(false);
            if (onError) onError(err);
          },
        });

        if (!result && cssString) {
          throw new Error('Failed to inject CSS');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error.message);
        setIsLoading(false);
        if (onError) onError(error);
      }
    }, debounceMs);

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cssString, debounceMs, onError, onSuccess]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    try {
      const startTime = performance.now();
      injectCSSVariables(cssString, { id: 'cms-preview-styles' });
      const endTime = performance.now();
      setRenderTime(Math.round(endTime - startTime));
      setIsLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message);
      setIsLoading(false);
    }
  }, [cssString]);

  // Get component visibility state
  const components = customizations.components || {};
  const showNavigation = components.navigation?.enabled !== false;
  const showHero = components.hero?.enabled !== false;
  const showFeatures = components.features?.enabled !== false;
  const showTestimonials = components.testimonials?.enabled !== false;
  const showCTA = components.ctaSection?.enabled !== false;
  const showContact = components.contact?.enabled !== false;
  const showFooter = components.footer?.enabled !== false;

  // Get content
  const content = customizations.content || {};
  const layout = customizations.layout || {};
  const containerWidth = layout.containerWidth || '1200px';
  const containerLayout = layout.containerLayout || 'centered';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>Real-time preview of your customizations</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Debug Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Injection Time: {injectionTime}ms</div>
          <div>Render Time: {renderTime}ms</div>
          <div>Debounce: {debounceMs}ms</div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Preview Container */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white" style={{}} >
          {/* Navigation */}
          {showNavigation && (
            <nav
              className="border-b border-gray-100 px-6 py-3 bg-gray-50"
              style={{
                backgroundColor: 'var(--color-background, white)',
                color: 'var(--color-text, black)',
              }}
            >
              <div className="text-sm font-semibold">Navigation</div>
            </nav>
          )}

          {/* Main Content Container */}
          <div
            className="flex flex-col"
            style={{
              maxWidth: containerWidth,
              margin: containerLayout === 'centered' ? '0 auto' : '0',
              width: '100%',
            }}
          >
            {/* Hero Section */}
            {showHero && (
              <section
                className="py-16 px-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100"
                style={{
                  backgroundColor: 'var(--color-background, white)',
                  padding: `var(--padding-hero-section, 40px)`,
                  minHeight: 'var(--hero-height, 400px)',
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: 'var(--font-size-h1, 48px)',
                      fontFamily: 'var(--font-family-headings, sans-serif)',
                      fontWeight: 'var(--font-weight-headings, 700)',
                      lineHeight: 'var(--line-height-headings, 1.2)',
                      color: 'var(--color-primary, #3B82F6)',
                      marginBottom: '12px',
                    }}
                  >
                    {content.hero?.heading || 'Hero Section Heading'}
                  </h1>
                  <p
                    style={{
                      fontSize: 'var(--font-size-body, 16px)',
                      fontFamily: 'var(--font-family-body, sans-serif)',
                      color: 'var(--color-text, #1F2937)',
                      lineHeight: 'var(--line-height-body, 1.5)',
                      marginBottom: '20px',
                      maxWidth: '600px',
                    }}
                  >
                    {content.hero?.subheading || 'Hero section subheading and description'}
                  </p>
                  <button
                    style={{
                      backgroundColor: 'var(--color-primary, #3B82F6)',
                      color: 'white',
                      padding: '10px 24px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-body, 16px)',
                      fontWeight: '600',
                    }}
                  >
                    {content.hero?.ctaText || 'Get Started'}
                  </button>
                </div>
              </section>
            )}

            {/* Features Section */}
            {showFeatures && (
              <section
                className="py-16 px-6 border-b border-gray-100"
                style={{
                  padding: `var(--padding-content-areas, 32px)`,
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--font-size-h2, 36px)',
                    fontFamily: 'var(--font-family-headings, sans-serif)',
                    fontWeight: 'var(--font-weight-headings, 700)',
                    color: 'var(--color-text, #1F2937)',
                    marginBottom: '24px',
                  }}
                >
                  Features
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(var(--features-columns, 3), 1fr)`,
                    gap: 'var(--gap-grid, 24px)',
                  }}
                >
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        padding: '20px',
                        border: `1px solid var(--color-borders, #E5E7EB)`,
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-background, white)',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 'var(--font-size-h3, 28px)',
                          fontFamily: 'var(--font-family-headings, sans-serif)',
                          color: 'var(--color-primary, #3B82F6)',
                          marginBottom: '8px',
                        }}
                      >
                        Feature {i}
                      </h3>
                      <p
                        style={{
                          fontSize: 'var(--font-size-body, 16px)',
                          color: 'var(--color-text, #1F2937)',
                          lineHeight: 'var(--line-height-body, 1.5)',
                        }}
                      >
                        Feature description
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Testimonials Section */}
            {showTestimonials && (
              <section
                className="py-16 px-6 border-b border-gray-100 bg-gray-50"
                style={{
                  padding: `var(--padding-content-areas, 32px)`,
                  backgroundColor: 'var(--color-background, #F9FAFB)',
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--font-size-h2, 36px)',
                    fontFamily: 'var(--font-family-headings, sans-serif)',
                    color: 'var(--color-text, #1F2937)',
                    marginBottom: '24px',
                  }}
                >
                  Testimonials
                </h2>
                <div style={{ display: 'flex', gap: 'var(--gap-flex, 16px)' }}>
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        padding: '20px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: `1px solid var(--color-borders, #E5E7EB)`,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 'var(--font-size-body, 16px)',
                          color: 'var(--color-text, #1F2937)',
                          marginBottom: '12px',
                          fontStyle: 'italic',
                        }}
                      >
                        "Great product and excellent service!"
                      </p>
                      <p style={{ fontWeight: '600', color: 'var(--color-primary, #3B82F6)' }}>
                        Customer {i}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CTA Section */}
            {showCTA && (
              <section
                className="py-12 px-6 bg-blue-50 border-b border-gray-100"
                style={{
                  backgroundColor: 'var(--color-accent, #F59E0B)',
                  opacity: 0.1,
                  padding: `var(--padding-content-areas, 32px)`,
                }}
              >
                <div className="text-center">
                  <h3
                    style={{
                      fontSize: 'var(--font-size-h2, 36px)',
                      fontFamily: 'var(--font-family-headings, sans-serif)',
                      color: 'var(--color-text, #1F2937)',
                      marginBottom: '12px',
                    }}
                  >
                    Ready to Get Started?
                  </h3>
                </div>
              </section>
            )}

            {/* Contact Section */}
            {showContact && (
              <section
                className="py-16 px-6 border-b border-gray-100"
                style={{
                  padding: `var(--padding-content-areas, 32px)`,
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--font-size-h2, 36px)',
                    fontFamily: 'var(--font-family-headings, sans-serif)',
                    color: 'var(--color-text, #1F2937)',
                    marginBottom: '24px',
                  }}
                >
                  Contact Us
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p>Email: {content.contact?.email || 'contact@example.com'}</p>
                  <p>Phone: {content.contact?.phone || '+1-555-000-0000'}</p>
                  <p>Address: {content.contact?.address || '123 Main St'}</p>
                </div>
              </section>
            )}

            {/* Footer */}
            {showFooter && (
              <footer
                className="py-12 px-6 bg-gray-900 text-white"
                style={{
                  backgroundColor: 'var(--color-text, #1F2937)',
                  padding: `var(--padding-footer, 24px) var(--padding-content-areas, 32px)`,
                  color: 'var(--color-background, white)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(var(--footer-link-columns, 4), 1fr)`,
                    gap: 'var(--gap-grid, 24px)',
                    marginBottom: '24px',
                  }}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <h4 style={{ fontWeight: '600', marginBottom: '12px' }}>Column {i}</h4>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li>Link 1</li>
                        <li>Link 2</li>
                        <li>Link 3</li>
                      </ul>
                    </div>
                  ))}
                </div>
                <p style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                  © 2024 Your Company. All rights reserved.
                </p>
              </footer>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            Updating preview...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
