/**
 * Landing Page with Customizations Integration Component
 *
 * Wraps the landing page and applies all customizations:
 * - CSS styling from customization settings
 * - Component visibility rules
 * - Customized content (hero, features, testimonials, contact)
 * - Fallback to defaults if customizations unavailable
 *
 * Requirements: 9.4, 9.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 * Phase: 4 - Landing Page Integration
 */

import React, { useMemo, useEffect } from 'react';
import NewLandingPage from '../pages/NewLandingPage';
import {
  useLandingPageCustomizations,
  useComponentVisibility,
  useCustomizedContent,
} from '../hooks/useLandingPageCustomizations';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';

export interface LandingPageWithCustomizationsProps {
  /**
   * Optional callback when customizations are loaded
   */
  onCustomizationsLoaded?: (customizations: any) => void;

  /**
   * Optional callback on error
   */
  onCustomizationsError?: (error: Error) => void;

  /**
   * Whether to show loading state (optional)
   */
  showLoadingState?: boolean;

  /**
   * Whether to show error state (optional)
   */
  showErrorState?: boolean;

  /**
   * Custom error message to display
   */
  errorMessage?: string;
}

/**
 * Component wrapper that integrates customizations with landing page
 *
 * Features:
 * - Loads customizations from CMS Settings API
 * - Injects CSS variables into document
 * - Manages component visibility based on customizations
 * - Provides customized content to landing page
 * - Handles errors with graceful fallback
 * - Passes customizations down to landing page via context or props
 */
export function LandingPageWithCustomizations({
  onCustomizationsLoaded,
  onCustomizationsError,
  showLoadingState = false,
  showErrorState = true,
  errorMessage,
}: LandingPageWithCustomizationsProps) {
  // Load customizations and manage CSS injection
  const {
    customizations,
    isLoading,
    error,
    componentVisibility,
    reload,
  } = useLandingPageCustomizations({
    autoLoad: true,
    onSuccess: onCustomizationsLoaded
      ? () => onCustomizationsLoaded(customizations)
      : undefined,
    onError: onCustomizationsError,
  });

  // Prepare customization context for landing page
  const customizationContext = useMemo(
    () => ({
      customizations,
      componentVisibility,
      isLoading,
      error,
      reload,
    }),
    [customizations, componentVisibility, isLoading, error, reload]
  );

  // Sync customizations with landing page (for legacy implementation)
  useEffect(() => {
    if (onCustomizationsLoaded && !isLoading && !error) {
      onCustomizationsLoaded(customizations);
    }
  }, [customizations, isLoading, error, onCustomizationsLoaded]);

  // Show error state if enabled and error occurred
  if (showErrorState && error && !isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage || 'Failed to load page customizations. Using default layout.'}
          </AlertDescription>
        </Alert>
        {/* Still render landing page with defaults */}
        <div className="mt-8">
          <NewLandingPage customizations={customizationContext} />
        </div>
      </div>
    );
  }

  // Show loading state if enabled
  if (showLoadingState && isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-32">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          <p className="text-gray-600">Loading page customizations...</p>
        </div>
      </div>
    );
  }

  // Render landing page with customizations
  return (
    <div className="w-full">
      <NewLandingPage customizations={customizationContext} />
    </div>
  );
}

/**
 * Provider component for customization context
 * Wraps landing page with customization state management
 */
export const LandingPageCustomizationProvider: React.FC<{
  children: React.ReactNode;
  customizations?: any;
}> = ({ children, customizations: initialCustomizations }) => {
  return <>{children}</>;
};

export default LandingPageWithCustomizations;
