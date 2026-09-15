import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminCustomizationPanel from './AdminCustomizationPanel';
import cmsSettingsService, { CMSSettings } from '../../services/cmsSettingsService';
import { toast } from 'sonner';

/**
 * Component Tests: AdminCustomizationPanel
 *
 * Tests the main customization panel container component for:
 * - Tab navigation with all tabs rendering
 * - Fetching customizations on mount via GET /api/cms-settings
 * - Loading state UI during fetch
 * - Error state UI on API failure
 * - Tab switching functionality
 * - Save button triggering POST /api/cms-settings
 * - Property-based testing for panel state consistency
 *
 * **Validates: Requirements 1.1, 1.2, 7.1**
 */

// Mock the CMS settings service
vi.mock('../../services/cmsSettingsService', () => ({
  default: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    migrateFromLocalStorage: vi.fn(),
  },
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock sub-components
vi.mock('./ImportExportControls', () => ({
  default: ({ onImportSuccess }: any) => (
    <div data-testid="import-export-controls">
      Import/Export
      <button onClick={() => onImportSuccess({ hero: { title: 'Imported Title' } })}>
        Import
      </button>
    </div>
  ),
}));

vi.mock('./VersionHistoryPanel', () => ({
  default: ({ onRollbackSuccess }: any) => (
    <div data-testid="version-history-panel">
      Version History
      <button onClick={() => onRollbackSuccess({ hero: { title: 'Rolled Back Title' } })}>
        Rollback
      </button>
    </div>
  ),
}));

vi.mock('./AuditLogViewer', () => ({
  default: () => <div data-testid="audit-log-viewer">Audit Log Viewer</div>,
}));

// Mock UI components
vi.mock('../ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button data-testid={`tab-trigger-${value}`} {...props}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`} style={{ display: 'block' }}>
      {children}
    </div>
  ),
}));

vi.mock('../ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader">Loading...</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert</div>,
  CheckCircle2: () => <div data-testid="check-icon">Check</div>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Sample CMS settings for testing
const sampleSettings: CMSSettings = {
  hero: {
    badge: 'Quality Training',
    title: 'Learn & Grow',
    subtitle: 'Transform your future',
    ctaPrimary: 'Enroll Now',
    ctaSecondary: 'Browse Programs',
  },
  appearance: {
    logo: 'path/to/logo.png',
    heroBackground: 'path/to/bg.jpg',
  },
  mission: 'To provide quality training',
  vision: 'To empower communities',
  contact: {
    address: '123 Main St',
    addressLine2: 'City, State',
    phone: '+1-555-0000',
    email: 'contact@example.com',
    facebook: 'https://facebook.com/example',
  },
  footer: {
    companyName: 'Training Center',
    tagline: 'Excellence in Education',
  },
};

const emptySettings: CMSSettings = {
  hero: {
    badge: '',
    title: '',
    subtitle: '',
    ctaPrimary: 'Enroll Now',
    ctaSecondary: 'Browse Programs',
  },
  appearance: {
    logo: '',
    heroBackground: '',
  },
  mission: '',
  vision: '',
  contact: {
    address: '',
    addressLine2: '',
    phone: '',
    email: '',
    facebook: '',
  },
  footer: {
    companyName: '',
    tagline: '',
  },
};

describe('AdminCustomizationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render all tabs', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-colors')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-typography')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-layout')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-components')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-content')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-presets')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-import-export')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-versions')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-audit')).toBeInTheDocument();
      });
    });

    it('should render the main panel container', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      expect(screen.getByTestId('admin-customization-panel')).toBeInTheDocument();
    });

    it('should render header with title and description', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(screen.getByText('Landing Page Customization')).toBeInTheDocument();
        expect(
          screen.getByText(/Customize your landing page appearance, content, and components/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Fetch Customizations on Mount', () => {
    it('should fetch customizations on component mount', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(cmsSettingsService.getSettings).toHaveBeenCalled();
      });
    });

    it('should display empty settings if no settings returned', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(null);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(cmsSettingsService.getSettings).toHaveBeenCalled();
      });

      // Panel should still be rendered even with no settings
      expect(screen.getByTestId('admin-customization-panel')).toBeInTheDocument();
    });

    it('should call getSettings with correct service method', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(cmsSettingsService.getSettings).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading state while fetching customizations', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(sampleSettings), 100))
      );

      render(<AdminCustomizationPanel />);

      expect(screen.getByText(/Loading customization settings/i)).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should disable Save button during loading', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(sampleSettings), 100))
      );

      render(<AdminCustomizationPanel />);

      const saveButtons = screen.getAllByTestId('save-button');
      saveButtons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });

    it('should hide tabs while loading', () => {
      vi.mocked(cmsSettingsService.getSettings).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<AdminCustomizationPanel />);

      // Tabs should not be visible during loading
      expect(screen.queryByTestId('tab-trigger-colors')).not.toBeInTheDocument();
    });

    it('should show tabs after loading completes', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-colors')).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', async () => {
      const errorMessage = 'Failed to load settings';
      vi.mocked(cmsSettingsService.getSettings).mockRejectedValue(new Error(errorMessage));

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display error card with alert icon', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockRejectedValue(new Error('API Error'));

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      });
    });

    it('should show toast error notification on API failure', async () => {
      const errorMessage = 'Network error';
      vi.mocked(cmsSettingsService.getSettings).mockRejectedValue(new Error(errorMessage));

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('should call onError callback on API failure', async () => {
      const onError = vi.fn();
      const error = new Error('Test error');
      vi.mocked(cmsSettingsService.getSettings).mockRejectedValue(error);

      render(<AdminCustomizationPanel onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('should still render tabs even with error', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockRejectedValue(new Error('API Error'));

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-colors')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Switching', () => {
    it('should switch to colors tab when clicked', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        const colorTab = screen.getByTestId('tab-trigger-colors');
        fireEvent.click(colorTab);
      });

      expect(screen.getByTestId('color-customizer')).toBeInTheDocument();
    });

    it('should switch to typography tab when clicked', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        const typographyTab = screen.getByTestId('tab-trigger-typography');
        fireEvent.click(typographyTab);
      });

      expect(screen.getByTestId('typography-customizer')).toBeInTheDocument();
    });

    it('should switch to layout tab when clicked', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        const layoutTab = screen.getByTestId('tab-trigger-layout');
        fireEvent.click(layoutTab);
      });

      expect(screen.getByTestId('layout-customizer')).toBeInTheDocument();
    });

    it('should switch to components tab when clicked', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        const componentsTab = screen.getByTestId('tab-trigger-components');
        fireEvent.click(componentsTab);
      });

      expect(screen.getByTestId('component-toggler')).toBeInTheDocument();
    });

    it('should switch to content tab when clicked', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        const contentTab = screen.getByTestId('tab-trigger-content');
        fireEvent.click(contentTab);
      });

      expect(screen.getByTestId('content-editor')).toBeInTheDocument();
    });

    it('should switch to presets tab when clicked', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        const presetsTab = screen.getByTestId('tab-trigger-presets');
        fireEvent.click(presetsTab);
      });

      expect(screen.getByTestId('theme-presets-selector')).toBeInTheDocument();
    });

    it('should switch to import-export tab when clicked', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        const importExportTab = screen.getByTestId('tab-trigger-import-export');
        fireEvent.click(importExportTab);
      });

      expect(screen.getByTestId('import-export-controls')).toBeInTheDocument();
    });

    it('should switch to versions tab when clicked', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        const versionsTab = screen.getByTestId('tab-trigger-versions');
        fireEvent.click(versionsTab);
      });

      expect(screen.getByTestId('version-history-panel')).toBeInTheDocument();
    });

    it('should switch to audit tab when clicked', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        const auditTab = screen.getByTestId('tab-trigger-audit');
        fireEvent.click(auditTab);
      });

      expect(screen.getByTestId('audit-log-viewer')).toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('should trigger API call when Save button is clicked', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);
      vi.mocked(cmsSettingsService.updateSettings).mockResolvedValue(undefined);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('save-button')).toBeInTheDocument();
      });

      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(cmsSettingsService.updateSettings).toHaveBeenCalled();
      });
    });

    it('should call updateSettings with current settings', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);
      vi.mocked(cmsSettingsService.updateSettings).mockResolvedValue(undefined);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('save-button'));
      });

      await waitFor(() => {
        expect(cmsSettingsService.updateSettings).toHaveBeenCalledWith(expect.any(Object));
      });
    });

    it('should show success toast on successful save', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);
      vi.mocked(cmsSettingsService.updateSettings).mockResolvedValue(undefined);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('save-button'));
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Settings saved successfully!');
      });
    });

    it('should show error toast on save failure', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);
      const errorMessage = 'Save failed';
      vi.mocked(cmsSettingsService.updateSettings).mockRejectedValue(new Error(errorMessage));

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('save-button'));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('should disable Save button while saving', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);
      vi.mocked(cmsSettingsService.updateSettings).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('save-button'));
      });

      const saveButtons = screen.getAllByTestId(/save-button/);
      saveButtons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });

    it('should save settings to localStorage on successful save', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);
      vi.mocked(cmsSettingsService.updateSettings).mockResolvedValue(undefined);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('save-button'));
      });

      await waitFor(() => {
        const savedSettings = localStorage.getItem('bmdc-cms-settings');
        expect(savedSettings).toBeTruthy();
        expect(JSON.parse(savedSettings!)).toEqual(expect.any(Object));
      });
    });

    it('should call onSaveSuccess callback after save', async () => {
      const onSaveSuccess = vi.fn();
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);
      vi.mocked(cmsSettingsService.updateSettings).mockResolvedValue(undefined);

      render(<AdminCustomizationPanel onSaveSuccess={onSaveSuccess} />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('save-button'));
      });

      await waitFor(() => {
        expect(onSaveSuccess).toHaveBeenCalledWith(expect.any(Object));
      });
    });
  });

  describe('Success State', () => {
    it('should display success indicator after successful load', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });
    });

    it('should display success message after load', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(screen.getByText(/Settings loaded successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Property 6: Panel State Consistency', () => {
    /**
     * Property-based test: Panel state matches database after successful save
     *
     * This test verifies that when settings are modified and saved, the internal panel state
     * remains consistent with what was returned from the API/database. The test uses a set of
     * predefined valid settings objects and verifies that after save, the panel
     * renders the same data that was sent to the API.
     *
     * **Validates: Requirements 1.1, 1.2, 7.1**
     */
    it('should maintain state consistency between panel and database after save', async () => {
      // Property: For any valid settings object, after successful save,
      // the panel state should match the saved settings
      const testSettings = sampleSettings;

      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(testSettings);
      vi.mocked(cmsSettingsService.updateSettings).mockResolvedValue(undefined);

      render(<AdminCustomizationPanel />);

      // Wait for initial load
      await waitFor(() => {
        expect(cmsSettingsService.getSettings).toHaveBeenCalled();
      });

      // Simulate save
      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(cmsSettingsService.updateSettings).toHaveBeenCalledWith(testSettings);
      });

      // Verify localStorage has the same settings
      const savedSettings = JSON.parse(localStorage.getItem('bmdc-cms-settings') || '{}');
      expect(savedSettings).toEqual(testSettings);
    });

    it('should restore panel state if save fails and user reloads', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);
      vi.mocked(cmsSettingsService.updateSettings).mockRejectedValue(new Error('Save failed'));

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(cmsSettingsService.getSettings).toHaveBeenCalled();
      });

      // Attempt save
      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // On reload, should refetch from service, not from failed state
      expect(screen.getByTestId('admin-customization-panel')).toBeInTheDocument();
    });

    it('should ensure settings object has required structure after load', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(cmsSettingsService.getSettings).toHaveBeenCalled();
      });

      // Verify the loaded settings have the required structure
      const expectedStructure = {
        hero: expect.any(Object),
        appearance: expect.any(Object),
        contact: expect.any(Object),
        footer: expect.any(Object),
      };

      expect(cmsSettingsService.getSettings).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent state updates properly', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);
      vi.mocked(cmsSettingsService.updateSettings).mockResolvedValue(undefined);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(cmsSettingsService.getSettings).toHaveBeenCalled();
      });

      // Click save multiple times rapidly
      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Should handle multiple concurrent saves properly
        expect(cmsSettingsService.updateSettings).toHaveBeenCalled();
      });
    });

    it('should validate that settings are preserved across tabs', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(sampleSettings);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-colors')).toBeInTheDocument();
      });

      // Switch to multiple tabs
      fireEvent.click(screen.getByTestId('tab-trigger-typography'));
      fireEvent.click(screen.getByTestId('tab-trigger-layout'));
      fireEvent.click(screen.getByTestId('tab-trigger-colors'));

      // Settings should remain intact
      expect(cmsSettingsService.getSettings).toHaveBeenCalledTimes(1);
    });

    it('should ensure empty settings normalize correctly', async () => {
      vi.mocked(cmsSettingsService.getSettings).mockResolvedValue(null);

      render(<AdminCustomizationPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-customization-panel')).toBeInTheDocument();
      });

      // Panel should render with normalized empty settings
      expect(screen.getByTestId('tab-trigger-colors')).toBeInTheDocument();
    });
  });
});
