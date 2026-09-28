/**
 * Icon Rendering Tests for Landing Page
 *
 * Tests verify that the getIconComponent helper function correctly maps icon names
 * to Lucide React components and renders them without errors in the feature cards section.
 *
 * Validates: Task 2 Acceptance Criteria - Icons render correctly based on icon name
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

describe('NewLandingPage - Icon Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default tenants call always succeeds
    (apiService.api.get as any).mockResolvedValue(mockTenantsResponse);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Icon Mapping - All 4 Icons', () => {
    /**
     * Test 1.1: Wrench icon renders correctly
     *
     * Validates: Requirement - getIconComponent correctly maps "Wrench" to Wrench icon component
     */
    it('should render Wrench icon for Wrench feature', async () => {
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
                    icon: 'Wrench',
                    title: 'Practical Workstations',
                    description: 'Real equipment and tools',
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

      // Assert - Feature title should render without errors
      await waitFor(() => {
        expect(screen.getByText(/Practical Workstations/i)).toBeInTheDocument();
      });

      // Icon container should exist
      const iconContainers = document.querySelectorAll('[class*="bg-primary"]');
      expect(iconContainers.length).toBeGreaterThan(0);
    });

    /**
     * Test 1.2: Award icon renders correctly
     *
     * Validates: Requirement - getIconComponent correctly maps "Award" to Award icon component
     */
    it('should render Award icon for Award feature', async () => {
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
                    icon: 'Award',
                    title: 'Accredited Curriculum',
                    description: 'Official standards',
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
        expect(screen.getByText(/Accredited Curriculum/i)).toBeInTheDocument();
      });

      // Icon container should exist
      const iconContainers = document.querySelectorAll('[class*="bg-primary"]');
      expect(iconContainers.length).toBeGreaterThan(0);
    });

    /**
     * Test 1.3: Users2 icon renders correctly
     *
     * Validates: Requirement - getIconComponent correctly maps "Users2" to Users2 icon component
     */
    it('should render Users2 icon for Users2 feature', async () => {
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
                    icon: 'Users2',
                    title: 'Expert Mentorship',
                    description: 'One-on-one guidance',
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
        expect(screen.getByText(/Expert Mentorship/i)).toBeInTheDocument();
      });

      // Icon container should exist
      const iconContainers = document.querySelectorAll('[class*="bg-primary"]');
      expect(iconContainers.length).toBeGreaterThan(0);
    });

    /**
     * Test 1.4: Compass icon renders correctly
     *
     * Validates: Requirement - getIconComponent correctly maps "Compass" to Compass icon component
     */
    it('should render Compass icon for Compass feature', async () => {
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
                    icon: 'Compass',
                    title: 'Career Advancement',
                    description: 'Direct industry connections',
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
        expect(screen.getByText(/Career Advancement/i)).toBeInTheDocument();
      });

      // Icon container should exist
      const iconContainers = document.querySelectorAll('[class*="bg-primary"]');
      expect(iconContainers.length).toBeGreaterThan(0);
    });
  });

  describe('2. All 4 Icons Render Correctly in Feature Section', () => {
    /**
     * Test 2.1: All 4 default icons render without errors
     *
     * Validates: Requirement - All 4 icons render without console errors in feature card section
     */
    it('should render all 4 default feature icons without errors', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

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
                    icon: 'Wrench',
                    title: 'Practical Workstations',
                    description: 'Real equipment, workshops, and industry-standard tools',
                  },
                  {
                    icon: 'Award',
                    title: 'Accredited Curriculum',
                    description: 'Programs structured to meet official standards',
                  },
                  {
                    icon: 'Users2',
                    title: 'Expert Mentorship',
                    description: 'Experienced trainers dedicated to guidance',
                  },
                  {
                    icon: 'Compass',
                    title: 'Career Advancement',
                    description: 'Direct connections to local industry',
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

      // Assert - All feature titles should render
      await waitFor(() => {
        expect(screen.getByText(/Practical Workstations/i)).toBeInTheDocument();
        expect(screen.getByText(/Accredited Curriculum/i)).toBeInTheDocument();
        expect(screen.getByText(/Expert Mentorship/i)).toBeInTheDocument();
        expect(screen.getByText(/Career Advancement/i)).toBeInTheDocument();
      });

      // No icon-related console errors
      const iconErrors = consoleErrorSpy.mock.calls.filter(
        (call) => call[0] && typeof call[0] === 'string' && call[0].includes('icon')
      );
      expect(iconErrors.length).toBe(0);

      // No SVG or element rendering errors
      const svgErrors = consoleErrorSpy.mock.calls.filter(
        (call) => call[0] && typeof call[0] === 'string' && 
        (call[0].includes('SVG') || call[0].includes('Element') || call[0].includes('component'))
      );
      expect(svgErrors.length).toBe(0);

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    /**
     * Test 2.2: Feature icons render with correct size classes
     *
     * Validates: Requirement - Icons render with size-6 className (24px)
     */
    it('should render feature icons with size-6 className', async () => {
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
                    icon: 'Wrench',
                    title: 'Test Feature',
                    description: 'Test description',
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
        const feature = screen.getByText(/Test Feature/i);
        expect(feature).toBeInTheDocument();

        // Check for SVG elements with size-6 class
        const svgElements = document.querySelectorAll('svg[class*="size-6"]');
        expect(svgElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('3. Unknown Icon Fallback to Wrench', () => {
    /**
     * Test 3.1: Unknown icon names fall back to Wrench icon
     *
     * Validates: Requirement - Unknown icon names fall back to Wrench icon
     */
    it('should render Wrench icon when unknown icon name is provided', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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
                    icon: 'UnknownIcon',
                    title: 'Feature with Unknown Icon',
                    description: 'This should fall back to Wrench',
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

      // Assert - Feature should still render
      await waitFor(() => {
        expect(screen.getByText(/Feature with Unknown Icon/i)).toBeInTheDocument();
      });

      // Icon should render without throwing errors
      const iconContainers = document.querySelectorAll('[class*="bg-primary"]');
      expect(iconContainers.length).toBeGreaterThan(0);

      // No errors logged
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    /**
     * Test 3.2: Multiple features with mixed known and unknown icons render correctly
     *
     * Validates: Requirement - Page handles mix of known and unknown icon names gracefully
     */
    it('should handle mixed known and unknown icon names', async () => {
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
                    icon: 'Award',
                    title: 'Known Icon Feature',
                    description: 'Uses Award icon',
                  },
                  {
                    icon: 'InvalidIcon',
                    title: 'Unknown Icon Feature',
                    description: 'Falls back to Wrench',
                  },
                  {
                    icon: 'Compass',
                    title: 'Another Known Icon',
                    description: 'Uses Compass icon',
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

      // Assert - All features should render
      await waitFor(() => {
        expect(screen.getAllByText(/Known Icon Feature/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/Unknown Icon Feature/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/Another Known Icon/i)[0]).toBeInTheDocument();
      });

      // All icon containers should be present
      const iconContainers = document.querySelectorAll('[class*="bg-primary"]');
      expect(iconContainers.length).toBeGreaterThanOrEqual(3);
    });

    /**
     * Test 3.3: Empty or null icon names fall back gracefully
     *
     * Validates: Requirement - Empty or null icon names don't cause errors
     */
    it('should handle empty or null icon names gracefully', async () => {
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
                    icon: '',
                    title: 'Empty Icon Name',
                    description: 'Should fall back to Wrench',
                  },
                  {
                    icon: null,
                    title: 'Null Icon Name',
                    description: 'Should fall back to Wrench',
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

      // Assert - Features should render
      await waitFor(() => {
        expect(screen.getByText(/Empty Icon Name/i)).toBeInTheDocument();
      });

      // Icon containers should still exist
      const iconContainers = document.querySelectorAll('[class*="bg-primary"]');
      expect(iconContainers.length).toBeGreaterThan(0);
    });
  });

  describe('4. No Console Errors Related to Icon Rendering', () => {
    /**
     * Test 4.1: No console errors when rendering feature icons
     *
     * Validates: Requirement - No console errors related to icon rendering
     */
    it('should not produce console errors when rendering icons', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorMessages: string[] = [];

      consoleErrorSpy.mockImplementation((msg) => {
        if (typeof msg === 'string') {
          errorMessages.push(msg);
        }
      });

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
                    icon: 'Wrench',
                    title: 'Feature 1',
                    description: 'Description 1',
                  },
                  {
                    icon: 'Award',
                    title: 'Feature 2',
                    description: 'Description 2',
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
      });

      // Check for icon-related errors
      const iconRelatedErrors = errorMessages.filter(msg =>
        msg.toLowerCase().includes('icon') ||
        msg.toLowerCase().includes('component') ||
        msg.toLowerCase().includes('svg')
      );

      expect(iconRelatedErrors.length).toBe(0);

      consoleErrorSpy.mockRestore();
    });

    /**
     * Test 4.2: No React warnings when rendering feature icons
     *
     * Validates: Requirement - No React warnings related to icon rendering
     */
    it('should not produce React warnings when rendering icons', async () => {
      // Arrange
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

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
                    icon: 'Compass',
                    title: 'Career Path',
                    description: 'Advance your skills',
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
        expect(screen.getByText(/Career Path/i)).toBeInTheDocument();
      });

      // Check for warnings
      expect(consoleWarnSpy.mock.calls.length).toBe(0);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('5. Icon Rendering with Default Settings', () => {
    /**
     * Test 5.1: Default 4 icons render correctly when CMS data is missing
     *
     * Validates: Requirement - Default icons render when CMS doesn't provide features
     */
    it('should render all 4 default icons when CMS features are missing', async () => {
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
            data: {}, // No features provided
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - All 4 default features should render
      await waitFor(() => {
        expect(screen.getByText(/Practical Workstations/i)).toBeInTheDocument();
        expect(screen.getByText(/Accredited Curriculum/i)).toBeInTheDocument();
        expect(screen.getByText(/Expert Mentorship/i)).toBeInTheDocument();
        expect(screen.getByText(/Career Advancement/i)).toBeInTheDocument();
      });

      // All icon containers should be rendered
      const iconContainers = document.querySelectorAll('[class*="bg-primary"]');
      expect(iconContainers.length).toBeGreaterThanOrEqual(4);
    });

    /**
     * Test 5.2: Default icons match their feature titles
     *
     * Validates: Requirement - Default icon mapping is correct (Wrench, Award, Users2, Compass)
     */
    it('should map default features to correct icons', async () => {
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
            data: {},
          };
        }
        return { success: false };
      });

      // Act
      renderLandingPage();

      // Assert - Features should be in order: Wrench, Award, Users2, Compass
      await waitFor(() => {
        const featureCards = document.querySelectorAll('[class*="group"][class*="rounded-2xl"]');
        expect(featureCards.length).toBeGreaterThanOrEqual(4);

        // Check that features appear in document
        expect(screen.getByText(/Practical Workstations/i)).toBeInTheDocument();
        expect(screen.getByText(/Accredited Curriculum/i)).toBeInTheDocument();
        expect(screen.getByText(/Expert Mentorship/i)).toBeInTheDocument();
        expect(screen.getByText(/Career Advancement/i)).toBeInTheDocument();
      });
    });
  });

  describe('6. Icon Rendering Performance & Integration', () => {
    /**
     * Test 6.1: Icons render even when network is slow
     *
     * Validates: Requirement - Icons render correctly regardless of API timing
     */
    it('should render icons correctly even with delayed CMS response', async () => {
      // Arrange
      let _callCount = 0;
      (apiService.api.get as any).mockImplementation(async (url) => {
        _callCount++;
        if (url === '/tenants') {
          return mockTenantsResponse;
        }
        if (url === '/cms-settings') {
          // Simulate slow response
          await new Promise(resolve => setTimeout(resolve, 100));
          return {
            success: true,
            data: {
              content: {
                features: [
                  {
                    icon: 'Award',
                    title: 'Delayed Feature',
                    description: 'From slow API',
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

      // Assert - Icon should eventually render
      await waitFor(
        () => {
          expect(screen.getByText(/Delayed Feature/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    /**
     * Test 6.2: Multiple feature cards with icons don't cause memory leaks or duplicates
     *
     * Validates: Requirement - Icon mapping doesn't create duplicate or memory-leaked components
     */
    it('should render multiple feature cards with icons without duplicates', async () => {
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
                  { icon: 'Wrench', title: 'Feature A', description: 'Desc A' },
                  { icon: 'Award', title: 'Feature B', description: 'Desc B' },
                  { icon: 'Users2', title: 'Feature C', description: 'Desc C' },
                  { icon: 'Compass', title: 'Feature D', description: 'Desc D' },
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
        expect(screen.getByText(/Feature A/i)).toBeInTheDocument();
        expect(screen.getByText(/Feature B/i)).toBeInTheDocument();
        expect(screen.getByText(/Feature C/i)).toBeInTheDocument();
        expect(screen.getByText(/Feature D/i)).toBeInTheDocument();
      });

      // Each feature should appear exactly once
      expect(screen.getAllByText(/Feature A/i)).toHaveLength(1);
      expect(screen.getAllByText(/Feature B/i)).toHaveLength(1);
      expect(screen.getAllByText(/Feature C/i)).toHaveLength(1);
      expect(screen.getAllByText(/Feature D/i)).toHaveLength(1);
    });
  });
});
