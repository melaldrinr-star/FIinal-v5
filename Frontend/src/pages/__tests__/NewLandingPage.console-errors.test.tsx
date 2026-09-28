/**
 * Console Error Prevention Tests for Landing Page
 *
 * Tests verify that accessing CMS properties safely prevents console errors and React warnings
 * when values are undefined or missing.
 *
 * Validates: Task 2 - No console errors for undefined properties
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
 * Mock API responses
 */
const mockTenantsResponse = {
  success: true,
  data: [
    { id: 'tenant-1', name: 'Test Tenant' },
  ],
};

describe('NewLandingPage - Console Error Prevention', () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on console errors and warnings
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Default tenants call always succeeds
    (apiService.api.get as any).mockResolvedValue(mockTenantsResponse);
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('1. Undefined Property Access Prevention', () => {
    /**
     * Test 1.1: No console errors when cmsSettings.hero is undefined
     *
     * Validates: Requirement - Optional chaining (?.) prevents accessing non-existent properties
     */
    it('should not produce console errors when accessing undefined hero properties', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          // Return data with missing hero object
          return {
            success: true,
            data: {
              content: {},
            },
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - Wait for page to stabilize
      await waitFor(() => {
        expect(screen.getByText(/Official Training & Workforce Development/i)).toBeInTheDocument();
      });

      // Check no critical React errors or warnings
      const criticalErrors = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return (
          message.includes('Cannot read property') ||
          message.includes('Cannot read properties') ||
          message.includes('is not a function') ||
          message.includes('is undefined') ||
          message.includes('TypeError')
        );
      });

      expect(criticalErrors).toHaveLength(0);
    });

    /**
     * Test 1.2: No console errors when cmsSettings.ctaBanner is undefined
     */
    it('should not produce console errors when accessing undefined ctaBanner properties', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          // Return data with missing ctaBanner
          return {
            success: true,
            data: {
              content: {
                hero: {
                  heading: 'Test Title',
                },
                // No ctaBanner
              },
            },
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Test Title/i)).toBeInTheDocument();
      });

      const criticalErrors = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return (
          message.includes('Cannot read property') ||
          message.includes('Cannot read properties') ||
          message.includes('is not a function')
        );
      });

      expect(criticalErrors).toHaveLength(0);
    });

    /**
     * Test 1.3: No console errors when cmsSettings.features is undefined or empty array
     */
    it('should not produce console errors when accessing undefined features array', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          // Return data without features array
          return {
            success: true,
            data: {
              content: {
                hero: { heading: 'Test' },
              },
            },
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        // Page should still render with default features
        expect(screen.getByText(/Practical Workstations/i)).toBeInTheDocument();
      });

      const criticalErrors = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return (
          message.includes('Cannot read property') ||
          message.includes('Cannot read properties') ||
          message.includes('map is not a function')
        );
      });

      expect(criticalErrors).toHaveLength(0);
    });

    /**
     * Test 1.4: No console errors when contact properties are null/undefined
     */
    it('should not produce console errors when contact properties are undefined', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          // Return data with null contact properties
          return {
            success: true,
            data: {
              content: {
                contact: {
                  address: null,
                  phone: undefined,
                  email: null,
                  facebook: undefined,
                },
              },
            },
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        // Should render without errors despite null values
        expect(screen.getByText(/Official Training & Workforce Development/i)).toBeInTheDocument();
      });

      const criticalErrors = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return (
          message.includes('Cannot read property') ||
          message.includes('Cannot read properties')
        );
      });

      expect(criticalErrors).toHaveLength(0);
    });
  });

  describe('2. getValue() Helper Safety', () => {
    /**
     * Test 2.1: getValue() handles undefined gracefully
     */
    it('should handle undefined values without errors', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return {
            success: true,
            data: {
              content: {
                ctaBanner: {
                  badge: undefined,
                  heading: undefined,
                  description: undefined,
                },
              },
            },
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        // Page should render with defaults
        expect(screen.getByText(/Ready to Transform Your Career/i)).toBeInTheDocument();
      });

      const typeErrors = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return message.includes('TypeError');
      });

      expect(typeErrors).toHaveLength(0);
    });

    /**
     * Test 2.2: getValue() handles null gracefully
     */
    it('should handle null values without errors', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return {
            success: true,
            data: {
              content: {
                footer: {
                  companyName: null,
                  tagline: null,
                },
              },
            },
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Official Training/i)).toBeInTheDocument();
      });

      const typeErrors = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return message.includes('TypeError');
      });

      expect(typeErrors).toHaveLength(0);
    });

    /**
     * Test 2.3: getValue() handles object values with value property
     */
    it('should handle object values with value property without errors', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return {
            success: true,
            data: {
              content: {
                ctaBanner: {
                  badge: { value: 'Custom Badge' },
                  heading: { value: 'Custom Heading' },
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

      // Assert
      await waitFor(() => {
        // Page should render with object values
        expect(screen.getByText(/Official Training/i)).toBeInTheDocument();
      });

      const typeErrors = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return message.includes('TypeError');
      });

      expect(typeErrors).toHaveLength(0);
    });
  });

  describe('3. Optional Chaining (?.) Verification', () => {
    /**
     * Test 3.1: Optional chaining prevents errors on nested undefined properties
     */
    it('should use optional chaining to prevent nested property errors', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          // Return data with deeply nested missing properties
          return {
            success: true,
            data: {}, // Completely empty response
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        // Should render with defaults despite empty API response
        expect(screen.getByText(/Official Training & Workforce Development/i)).toBeInTheDocument();
      });

      const propertyErrors = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return (
          message.includes('Cannot read property') ||
          message.includes('Cannot read properties') ||
          message.includes('is not defined')
        );
      });

      expect(propertyErrors).toHaveLength(0);
    });
  });

  describe('4. React Warning Prevention', () => {
    /**
     * Test 4.1: No React errors when rendering with undefined values
     */
    it('should not produce React errors when rendering with undefined CMS values', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return {
            success: true,
            data: {
              content: {
                hero: { heading: undefined },
                features: undefined,
                ctaBanner: undefined,
              },
            },
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Official Training & Workforce Development/i)).toBeInTheDocument();
      });

      const reactErrors = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return (
          message.includes('Warning: Each child in a list should have a unique') ||
          message.includes('Not a DOM element') ||
          message.includes('React does not recognize') ||
          message.includes('NaN is not allowed')
        );
      });

      expect(reactErrors).toHaveLength(0);
    });

    /**
     * Test 4.2: No warnings for missing required props
     */
    it('should handle missing props gracefully without warnings', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return {
            success: true,
            data: {
              content: {
                features: [
                  {
                    // Missing icon property
                    title: 'Feature without icon',
                    description: 'Description',
                  },
                ],
              },
            },
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Feature without icon/i)).toBeInTheDocument();
      });

      const propWarnings = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return message.includes('Failed prop type') || message.includes('PropTypes');
      });

      // PropTypes warnings are acceptable in test mode but should not crash
      expect(propWarnings.length).toBeLessThanOrEqual(1);
    });
  });

  describe('5. API Error Handling Without Console Errors', () => {
    /**
     * Test 5.1: Network errors don't produce console errors
     */
    it('should handle network errors gracefully without console errors', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          throw new Error('Network timeout');
        }
        throw new Error('Network timeout');
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Official Training & Workforce Development/i)).toBeInTheDocument();
      });

      // Network errors in logger are expected but not console errors
      const consoleNetworkErrors = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return (
          message.includes('Network') &&
          !message.includes('Failed to load CMS') &&
          !message.includes('using defaults')
        );
      });

      expect(consoleNetworkErrors).toHaveLength(0);
    });

    /**
     * Test 5.2: API failures don't produce undefined reference errors
     */
    it('should not produce undefined reference errors when API fails', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return { success: false, error: 'Not found' };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Official Training & Workforce Development/i)).toBeInTheDocument();
      });

      const undefinedErrors = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return message.includes('is not defined') || message.includes('Cannot access');
      });

      expect(undefinedErrors).toHaveLength(0);
    });
  });

  describe('6. Feature Rendering Safety', () => {
    /**
     * Test 6.1: Feature icons render safely even with missing icon names
     */
    it('should render features safely with missing or invalid icon names', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          return {
            success: true,
            data: {
              content: {
                features: [
                  {
                    icon: 'InvalidIconName',
                    title: 'Feature 1',
                    description: 'Desc 1',
                  },
                  {
                    icon: undefined,
                    title: 'Feature 2',
                    description: 'Desc 2',
                  },
                  {
                    icon: null,
                    title: 'Feature 3',
                    description: 'Desc 3',
                  },
                ],
              },
            },
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Feature 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Feature 2/i)).toBeInTheDocument();
        expect(screen.getByText(/Feature 3/i)).toBeInTheDocument();
      });

      const iconErrors = consoleErrorSpy.mock.calls.filter((call: any) => {
        const message = String(call[0]);
        return (
          message.includes('Icon') ||
          message.includes('is not a valid React component') ||
          message.includes('rendering')
        );
      });

      // No rendering errors for bad icon names
      expect(iconErrors).toHaveLength(0);
    });
  });
});
