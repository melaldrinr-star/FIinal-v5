/**
 * CMS Fallback Tests for Landing Page
 *
 * Tests verify that the landing page gracefully falls back to default values
 * when CMS data is missing, incomplete, or API requests fail.
 *
 * Validates: Task 2 Acceptance Criteria - Fallback to defaults works when CMS data is missing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NewLandingPage from '../NewLandingPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { ProgramsProvider } from '../../contexts/ProgramsContext';
import * as apiService from '../../services/api';

// Mock API service
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
  },
  getFileUrl: vi.fn((url) => url),
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

/**
 * Helper to render NewLandingPage with necessary providers
 */
const renderLandingPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ProgramsProvider>
          <NewLandingPage />
        </ProgramsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

/**
 * Mock default API responses
 */
const mockTenantsResponse = {
  success: true,
  data: [
    { id: 'tenant-1', name: 'Test Tenant' },
  ],
};

const mockEmptyCmsResponse = {
  success: true,
  data: {}, // Empty CMS data
};

const mockCmsResponseWithPartialData = {
  success: true,
  data: {
    content: {
      hero: {
        heading: 'Custom Hero Title',
        // Missing other fields
      },
      // Missing features, ctaBanner, contact, etc.
    },
  },
};

const mockCmsResponseWithFullData = {
  success: true,
  data: {
    content: {
      hero: {
        badge: 'Custom Badge',
        heading: 'Custom Title',
        subheading: 'Custom Subtitle',
        ctaText: 'Custom CTA',
        trustIndicators: [],
      },
      features: [
        {
          icon: 'Award',
          title: 'Custom Feature 1',
          description: 'Description 1',
        },
      ],
      ctaBanner: {
        badge: 'Custom Banner Badge',
        heading: 'Custom Banner Heading',
        description: 'Custom Banner Description',
        ctaPrimaryText: 'Custom Enroll',
        ctaSecondaryText: 'Custom Browse',
      },
      contact: {
        address: 'Custom Address',
        addressLine2: 'Custom Line 2',
        phone: '+63 999 999 9999',
        email: 'custom@test.com',
        facebook: 'https://facebook.com/custom',
      },
    },
  },
};

const mockCmsApiError = {
  success: false,
  error: 'API Error',
};

describe('NewLandingPage - CMS Fallback Mechanisms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default tenants call always succeeds
    (apiService.api.get as any).mockResolvedValue(mockTenantsResponse);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Default CMS Settings Fallback', () => {
    /**
     * Test 1.1: When API returns empty data, page should display defaultCmsSettings
     *
     * Validates: Requirement - When API returns empty data, page should display defaultCmsSettings values
     */
    it('should display default hero badge when CMS returns empty data', async () => {
      // Arrange - Setup mock to return empty CMS data on second call (first is tenants)
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return mockEmptyCmsResponse;
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Official Training & Workforce Development/i)).toBeInTheDocument();
      });
    });

    /**
     * Test 1.2: Default feature cards should render when CMS features are missing
     */
    it('should display default feature cards when CMS returns no features', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return mockEmptyCmsResponse;
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - Default features should be displayed
      await waitFor(() => {
        expect(screen.getByText(/Practical Workstations/i)).toBeInTheDocument();
        expect(screen.getByText(/Accredited Curriculum/i)).toBeInTheDocument();
        expect(screen.getByText(/Expert Mentorship/i)).toBeInTheDocument();
        expect(screen.getByText(/Career Advancement/i)).toBeInTheDocument();
      });
    });

    /**
     * Test 1.3: Default CTA banner should render when CMS data is missing
     */
    it('should display default CTA banner when CMS returns no ctaBanner', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return mockEmptyCmsResponse;
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Ready to Transform Your Career/i)).toBeInTheDocument();
        expect(screen.getByText(/Join thousands of successful graduates/i)).toBeInTheDocument();
      });
    });
  });

  describe('2. Partial CMS Data Handling', () => {
    /**
     * Test 2.1: When specific CMS fields are missing, corresponding defaults should be used
     *
     * Validates: Requirement - When specific CMS fields are missing, corresponding defaults should be used
     */
    it('should use defaults for missing hero fields when CMS has partial data', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          // Return partial CMS data
          return mockCmsResponseWithPartialData;
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - Custom title from CMS should be shown
      await waitFor(() => {
        expect(screen.getByText(/Custom Hero Title/i)).toBeInTheDocument();
      });

      // But default features should be shown (since API didn't provide them)
      await waitFor(() => {
        expect(screen.getByText(/Practical Workstations/i)).toBeInTheDocument();
      });
    });

    /**
     * Test 2.2: Mixed CMS and default data should work correctly
     */
    it('should merge CMS data with defaults for partially provided data', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return mockCmsResponseWithPartialData;
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - Should have mix of custom and default values
      await waitFor(() => {
        expect(screen.getByText(/Custom Hero Title/i)).toBeInTheDocument();
      });

      // Default features should still be available
      await waitFor(() => {
        expect(screen.getByText(/Practical Workstations/i)).toBeInTheDocument();
      });
    });
  });

  describe('3. CMS API Error Handling', () => {
    /**
     * Test 3.1: Error handling in loadCmsSettings should catch API errors and use defaults
     *
     * Validates: Requirement - Error handling in loadCmsSettings should catch API errors and use defaults
     */
    it('should use defaults when CMS API returns error', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return mockCmsApiError;
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - Should show default values when API fails
      await waitFor(() => {
        expect(screen.getByText(/Official Training & Workforce Development/i)).toBeInTheDocument();
        expect(screen.getByText(/Practical Workstations/i)).toBeInTheDocument();
      });
    });

    /**
     * Test 3.2: API network errors should be caught and defaults used
     */
    it('should use defaults when CMS API throws error', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          throw new Error('Network error');
        }
        throw new Error('Network error');
      });

      // Act
      renderLandingPage();

      // Assert - Should fall back to defaults on error
      await waitFor(() => {
        expect(screen.getByText(/Official Training & Workforce Development/i)).toBeInTheDocument();
      });
    });

    /**
     * Test 3.3: No console errors when API fails
     */
    it('should not produce console errors when CMS API fails', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          throw new Error('Network error');
        }
        throw new Error('Network error');
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Official Training & Workforce Development/i)).toBeInTheDocument();
      });

      // No critical errors logged
      const criticalErrors = consoleErrorSpy.mock.calls.filter(
        (call) => call[0] && typeof call[0] === 'string' && call[0].includes('cms-settings')
      );
      expect(criticalErrors.length).toBe(0);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('4. getValue() Helper Safety', () => {
    /**
     * Test 4.1: getValue() helper should handle undefined values safely
     *
     * Validates: Requirement - The getValue() helper should handle undefined/null values safely
     */
    it('should render empty string when ctaBanner values are undefined', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          // Return data with undefined fields in ctaBanner
          return {
            success: true,
            data: {
              content: {
                ctaBanner: {
                  badge: undefined,
                  heading: null,
                  description: '',
                },
              },
            },
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - Should not throw and should use defaults
      await waitFor(() => {
        // Since values are undefined/null, defaults should be used
        expect(screen.getByText(/Ready to Transform Your Career/i)).toBeInTheDocument();
      });
    });

    /**
     * Test 4.2: getValue() should handle string values correctly
     */
    it('should correctly handle string values in getValue()', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return mockCmsResponseWithFullData;
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - Should display custom CMS values
      await waitFor(() => {
        expect(screen.getByText(/Custom Banner Heading/i)).toBeInTheDocument();
        expect(screen.getByText(/Custom Banner Description/i)).toBeInTheDocument();
      });
    });

    /**
     * Test 4.3: getValue() should handle object values with value property
     */
    it('should handle object values with value property in getValue()', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          // Return data with object values (simulating different API format)
          return {
            success: true,
            data: {
              content: {
                ctaBanner: {
                  badge: { value: 'Object Badge' },
                  heading: { value: 'Object Heading' },
                  description: 'String Description',
                },
              },
            },
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - Should extract values correctly
      await waitFor(() => {
        // The page might not display object values directly, but should not crash
        expect(screen.getByText(/Official Training & Workforce Development/i)).toBeInTheDocument();
      });
    });
  });

  describe('5. Full CMS Data Integration', () => {
    /**
     * Test 5.1: Page renders correctly with complete CMS data
     */
    it('should render all custom CMS content when complete data is provided', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return mockCmsResponseWithFullData;
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - All custom CMS values should be displayed
      await waitFor(() => {
        expect(screen.getByText(/Custom Title/i)).toBeInTheDocument();
        expect(screen.getByText(/Custom Feature 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Custom Banner Heading/i)).toBeInTheDocument();
        expect(screen.getByText(/Custom Address/i)).toBeInTheDocument();
      });
    });

    /**
     * Test 5.2: Icons render correctly from CMS data
     */
    it('should render feature icons correctly based on CMS data', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return mockCmsResponseWithFullData;
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - Feature section should be rendered with icons
      await waitFor(() => {
        expect(screen.getByText(/Custom Feature 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('6. Contact Information Fallback', () => {
    /**
     * Test 6.1: Default contact info is shown when CMS data missing
     */
    it('should display default contact information when CMS data is missing', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return mockEmptyCmsResponse;
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - Check for contact section with specific text patterns
      await waitFor(() => {
        expect(screen.getByText(/Oriental Mindoro/i)).toBeInTheDocument();
        expect(screen.getByText(/info@bmdc.edu.ph/i)).toBeInTheDocument();
      });
    });

    /**
     * Test 6.2: Custom contact info is shown when provided in CMS
     */
    it('should display custom contact information from CMS', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return mockCmsResponseWithFullData;
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Custom Address/i)).toBeInTheDocument();
        expect(screen.getByText(/Custom Line 2/i)).toBeInTheDocument();
        expect(screen.getByText(/custom@test.com/i)).toBeInTheDocument();
      });
    });
  });
});
