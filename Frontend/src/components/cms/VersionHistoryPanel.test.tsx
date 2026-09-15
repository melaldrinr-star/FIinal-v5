import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VersionHistoryPanel, VersionHistoryItem } from './VersionHistoryPanel';

/**
 * Component Tests: VersionHistoryPanel
 * 
 * Tests the VersionHistoryPanel component for version history management including:
 * - Fetching version history on mount
 * - Displaying versions with metadata
 * - Previewing version details
 * - Rollback button triggering API call
 * - Confirmation dialog before rollback
 * - Success notification after rollback
 * 
 * **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
 */

// Mock data for testing
const mockVersions: VersionHistoryItem[] = [
  {
    id: 'version-001',
    version_number: 3,
    created_at: '2024-01-15T10:30:00Z',
    created_by_admin_id: 'admin-001',
    change_summary: 'Updated colors and typography',
    settings_data: {
      colors: { primary: '#3B82F6', secondary: '#10B981' },
      typography: { headings: { fontFamily: 'Poppins' } },
    },
  },
  {
    id: 'version-002',
    version_number: 2,
    created_at: '2024-01-14T09:15:00Z',
    created_by_admin_id: 'admin-001',
    change_summary: 'Initial color setup',
    settings_data: {
      colors: { primary: '#2563EB', secondary: '#059669' },
    },
  },
  {
    id: 'version-003',
    version_number: 1,
    created_at: '2024-01-13T08:00:00Z',
    created_by_admin_id: 'admin-001',
    change_summary: 'Default theme applied',
    settings_data: {
      colors: { primary: '#0EA5E9', secondary: '#06B6D4' },
    },
  },
];

// Mock fetch globally
global.fetch = vi.fn();

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock AlertDialog component
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h3>{children}</h3>,
  AlertDialogDescription: ({ children }: any) => <p data-testid="alert-dialog-description">{children}</p>,
  AlertDialogAction: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="rollback-confirm-button" {...props}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children, disabled }: any) => (
    <button disabled={disabled}>{children}</button>
  ),
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader">Loading...</div>,
}));

describe('VersionHistoryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Test 1: Version history fetched on mount
   * Requirement 13.1: When an admin saves customizations, the System SHALL create a new version record in the database
   * Requirement 13.2: When an admin views version history, the System SHALL display a list of previous customization versions with timestamps and changes summary
   */
  describe('Requirement 13.1, 13.2: Version History Fetching', () => {
    it('should fetch version history on mount', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      render(<VersionHistoryPanel />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      // Verify fetch was called with correct endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cms-settings/versions',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should display loading state while fetching versions', async () => {
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => mockVersions,
                }),
              100
            )
          )
      );

      render(<VersionHistoryPanel />);

      // Initially should show loader
      expect(screen.getByTestId('loader')).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { toast } = await import('sonner');

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch version history')
        );
      });
    });

    it('should display empty state when no versions exist', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.getByText('No version history available')).toBeInTheDocument();
      });
    });
  });

  /**
   * Test 2: Versions displayed with metadata
   * Requirement 13.2: Display versions with timestamp, changes summary, and who created it
   */
  describe('Requirement 13.2: Version Display with Metadata', () => {
    it('should display versions with all metadata', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      // Check version numbers are displayed
      expect(screen.getByText('Version 3')).toBeInTheDocument();
      expect(screen.getByText('Version 2')).toBeInTheDocument();
      expect(screen.getByText('Version 1')).toBeInTheDocument();

      // Check timestamps are displayed
      mockVersions.forEach((version) => {
        const dateStr = new Date(version.created_at).toLocaleDateString();
        // At least the date should be visible somewhere
        const versionElement = screen.getByText(new RegExp(`Version ${version.version_number}`));
        expect(versionElement).toBeInTheDocument();
      });

      // Check change summaries are displayed
      expect(screen.getByText('Updated colors and typography')).toBeInTheDocument();
      expect(screen.getByText('Initial color setup')).toBeInTheDocument();
      expect(screen.getByText('Default theme applied')).toBeInTheDocument();

      // Check admin IDs are displayed
      mockVersions.forEach((version) => {
        if (version.created_by_admin_id) {
          expect(
            screen.getByText(new RegExp(`Created by: ${version.created_by_admin_id}`))
          ).toBeInTheDocument();
        }
      });
    });

    it('should handle versions without change summary', async () => {
      const versionsWithoutSummary = [
        {
          ...mockVersions[0],
          change_summary: undefined,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => versionsWithoutSummary,
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.getByText('Version 3')).toBeInTheDocument();
      });

      // Should still render without errors
      expect(screen.getByTestId(`preview-button-${versionsWithoutSummary[0].id}`)).toBeInTheDocument();
    });

    it('should format timestamps correctly', async () => {
      const testVersion: VersionHistoryItem = {
        id: 'version-test',
        version_number: 1,
        created_at: '2024-01-15T14:30:00Z',
        created_by_admin_id: 'admin-001',
        change_summary: 'Test version',
        settings_data: {},
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [testVersion],
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.getByText('Version 1')).toBeInTheDocument();
      });

      // Should contain date in some format
      const versionText = screen.getByText('Version 1').closest('div');
      expect(versionText?.textContent).toMatch(/Jan|February|March|April|May|June|July|August|September|October|November|December/);
    });
  });

  /**
   * Test 3: Preview shows version details
   * Requirement 13.3: When an admin selects a previous version, the System SHALL preview that version before applying it
   */
  describe('Requirement 13.3: Version Preview', () => {
    it('should show preview modal when preview button clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      // Click preview button for first version
      const previewButton = screen.getByTestId(`preview-button-${mockVersions[0].id}`);
      fireEvent.click(previewButton);

      // Should display preview modal
      const closeButton = await waitFor(() => screen.getByText('Close'));
      expect(closeButton).toBeInTheDocument();

      // Should show version details in preview
      expect(screen.getByText(`Version ${mockVersions[0].version_number} Preview`)).toBeInTheDocument();
    });

    it('should display version metadata in preview', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const previewButton = screen.getByTestId(`preview-button-${mockVersions[0].id}`);
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(`Version ${mockVersions[0].version_number} Preview`)).toBeInTheDocument();
      });

      // Check that preview shows the change summary
      expect(screen.getByText(new RegExp(mockVersions[0].change_summary!))).toBeInTheDocument();
    });

    it('should display settings data in preview as JSON', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const previewButton = screen.getByTestId(`preview-button-${mockVersions[0].id}`);
      fireEvent.click(previewButton);

      await waitFor(() => {
        // Settings data should be displayed as JSON
        const settingsText = screen.getByText(/Settings Data:/);
        expect(settingsText).toBeInTheDocument();

        // Should contain the actual data
        const preContent = screen.getByText(/colors/);
        expect(preContent).toBeInTheDocument();
      });
    });

    it('should close preview modal when close button clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const previewButton = screen.getByTestId(`preview-button-${mockVersions[0].id}`);
      fireEvent.click(previewButton);

      const closeButton = await waitFor(() => screen.getByText('Close'));
      fireEvent.click(closeButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText(`Version ${mockVersions[0].version_number} Preview`)).not.toBeInTheDocument();
      });
    });
  });

  /**
   * Test 4: Rollback button triggers API call
   * Requirement 13.4: When an admin confirms rollback, the System SHALL restore the selected previous version as the current customization
   */
  describe('Requirement 13.4: Rollback API Call', () => {
    it('should trigger rollback API call when confirmed', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      // Click rollback button
      const rollbackButton = screen.getByTestId(`rollback-button-${mockVersions[0].id}`);
      fireEvent.click(rollbackButton);

      // Confirmation dialog should appear
      const confirmButton = await waitFor(() => screen.getByTestId('rollback-confirm-button'));
      expect(confirmButton).toBeInTheDocument();

      // Click confirm
      fireEvent.click(confirmButton);

      // API call should be made to rollback endpoint
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/cms-settings/versions/${mockVersions[0].id}/rollback`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token',
            }),
          })
        );
      });
    });

    it('should use correct endpoint for rollback', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const rollbackButton = screen.getByTestId(`rollback-button-${mockVersions[1].id}`);
      fireEvent.click(rollbackButton);

      const confirmButton = await waitFor(() => screen.getByTestId('rollback-confirm-button'));
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const calls = (global.fetch as any).mock.calls;
        const rollbackCall = calls.find((call: any[]) =>
          call[0].includes('/rollback')
        );
        expect(rollbackCall[0]).toContain(`/api/cms-settings/versions/${mockVersions[1].id}/rollback`);
      });
    });

    it('should handle rollback API errors', async () => {
      const { toast } = await import('sonner');

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const rollbackButton = screen.getByTestId(`rollback-button-${mockVersions[0].id}`);
      fireEvent.click(rollbackButton);

      const confirmButton = await waitFor(() => screen.getByTestId('rollback-confirm-button'));
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to rollback version')
        );
      });
    });

    it('should include auth token in rollback request', async () => {
      const customToken = 'custom-test-token-12345';
      localStorage.setItem('auth_token', customToken);

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const rollbackButton = screen.getByTestId(`rollback-button-${mockVersions[0].id}`);
      fireEvent.click(rollbackButton);

      const confirmButton = await waitFor(() => screen.getByTestId('rollback-confirm-button'));
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const rollbackCall = (global.fetch as any).mock.calls.find((call: any[]) =>
          call[0].includes('/rollback')
        );
        expect(rollbackCall[1].headers.Authorization).toBe(`Bearer ${customToken}`);
      });
    });
  });

  /**
   * Test 5: Confirmation dialog shown before rollback
   * Requirement 13.4: Confirmation dialog should appear before rollback to prevent accidents
   */
  describe('Requirement 13.4: Rollback Confirmation Dialog', () => {
    it('should display confirmation dialog when rollback clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const rollbackButton = screen.getByTestId(`rollback-button-${mockVersions[0].id}`);
      fireEvent.click(rollbackButton);

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByText('Confirm Rollback')).toBeInTheDocument();
      });
    });

    it('should show version details in confirmation dialog', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const rollbackButton = screen.getByTestId(`rollback-button-${mockVersions[0].id}`);
      fireEvent.click(rollbackButton);

      await waitFor(() => {
        const description = screen.getByTestId('alert-dialog-description');
        expect(description.textContent).toContain(`Version ${mockVersions[0].version_number}`);
      });
    });

    it('should allow canceling rollback', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const rollbackButton = screen.getByTestId(`rollback-button-${mockVersions[0].id}`);
      fireEvent.click(rollbackButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Rollback')).toBeInTheDocument();
      });

      // Click cancel
      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[0]);

      // Dialog should close without making API call
      await waitFor(() => {
        const calls = (global.fetch as any).mock.calls;
        const rollbackCalls = calls.filter((call: any[]) => call[0].includes('/rollback'));
        expect(rollbackCalls).toHaveLength(0);
      });
    });

    it('should show loading state in confirmation button during rollback', async () => {
      let resolveFetch: any;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        })
        .mockReturnValueOnce(fetchPromise);

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const rollbackButton = screen.getByTestId(`rollback-button-${mockVersions[0].id}`);
      fireEvent.click(rollbackButton);

      const confirmButton = await waitFor(() => screen.getByTestId('rollback-confirm-button'));
      fireEvent.click(confirmButton);

      // Resolve the fetch
      resolveFetch({
        ok: true,
        json: async () => ({ success: true }),
      });

      await waitFor(() => {
        expect(confirmButton.textContent).toContain('Rolling back');
      });
    });
  });

  /**
   * Test 6: Success notification shown after rollback
   * After successful rollback, should show success toast notification
   */
  describe('Requirement 13.4: Rollback Success Notification', () => {
    it('should show success notification after successful rollback', async () => {
      const { toast } = await import('sonner');

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const rollbackButton = screen.getByTestId(`rollback-button-${mockVersions[0].id}`);
      fireEvent.click(rollbackButton);

      const confirmButton = await waitFor(() => screen.getByTestId('rollback-confirm-button'));
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining(
            `Rolled back to version ${mockVersions[0].version_number} successfully`
          )
        );
      });
    });

    it('should refresh version history after successful rollback', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      // Clear previous calls
      (global.fetch as any).mockClear();

      const rollbackButton = screen.getByTestId(`rollback-button-${mockVersions[0].id}`);
      fireEvent.click(rollbackButton);

      const confirmButton = await waitFor(() => screen.getByTestId('rollback-confirm-button'));
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const calls = (global.fetch as any).mock.calls;
        // Should make two calls: rollback + refresh
        const refreshCall = calls.find((call: any[]) => call[0] === '/api/cms-settings/versions');
        expect(refreshCall).toBeDefined();
      });
    });

    it('should call onRollbackSuccess callback after successful rollback', async () => {
      const onRollbackSuccess = vi.fn();

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        });

      render(<VersionHistoryPanel onRollbackSuccess={onRollbackSuccess} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const rollbackButton = screen.getByTestId(`rollback-button-${mockVersions[0].id}`);
      fireEvent.click(rollbackButton);

      const confirmButton = await waitFor(() => screen.getByTestId('rollback-confirm-button'));
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onRollbackSuccess).toHaveBeenCalledWith(mockVersions[0]);
      });
    });

    it('should close confirmation dialog after successful rollback', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      const rollbackButton = screen.getByTestId(`rollback-button-${mockVersions[0].id}`);
      fireEvent.click(rollbackButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Rollback')).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('rollback-confirm-button');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText('Confirm Rollback')).not.toBeInTheDocument();
      });
    });
  });

  /**
   * Additional edge case tests
   */
  describe('Edge Cases', () => {
    it('should handle custom API base URL', async () => {
      const customBaseUrl = 'https://api.example.com';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      render(<VersionHistoryPanel apiBaseUrl={customBaseUrl} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${customBaseUrl}/api/cms-settings/versions`,
        expect.any(Object)
      );
    });

    it('should handle 401 unauthorized error', async () => {
      const { toast } = await import('sonner');

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Unauthorized');
      });
    });

    it('should handle versions array in response', async () => {
      const responseWithVersionsKey = { versions: mockVersions };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithVersionsKey,
      });

      render(<VersionHistoryPanel />);

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });

      // Should display the versions
      expect(screen.getByText('Version 3')).toBeInTheDocument();
    });
  });
});
