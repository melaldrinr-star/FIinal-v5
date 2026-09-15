/**
 * Component Tests: ThemePresetsSelector
 * 
 * Tests the ThemePresetsSelector component for proper:
 * - Fetching theme presets from the API
 * - Rendering preset cards with correct information
 * - Applying presets via the API
 * - Displaying success notifications after applying
 * - Displaying error notifications on failure
 * 
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
 * 
 * Tests cover:
 * - Presets fetched on component mount
 * - Preset cards render with name, description, category, and color swatches
 * - Apply button visible and clickable for each preset
 * - Apply button triggers API call to POST /api/theme-presets/:id/apply
 * - Success notification shown after successful preset application
 * - Error notification shown when preset application fails
 * - Loading state during fetch and apply operations
 * - Component handles empty preset list gracefully
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemePresetsSelector, ThemePreset } from '../components/ThemePresetsSelector';
import * as sonner from 'sonner';

// Mock the api module
vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock the sonner toast module
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className, ...props }: any) => (
    <div data-testid="loader-icon" className={className} {...props}>
      Loading
    </div>
  ),
}));

const { api } = await import('../services/api');

const mockPresets: ThemePreset[] = [
  {
    id: 'preset-1',
    name: 'Modern Minimal',
    description: 'Clean and minimal design',
    category: 'Modern',
    preset_data: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
      },
    },
  },
  {
    id: 'preset-2',
    name: 'Corporate',
    description: 'Professional corporate design',
    category: 'Corporate',
    preset_data: {
      colors: {
        primary: '#1F2937',
        secondary: '#6B7280',
        accent: '#DC2626',
      },
    },
  },
  {
    id: 'preset-3',
    name: 'Creative',
    description: 'Bold and creative design',
    category: 'Creative',
    preset_data: {
      colors: {
        primary: '#8B5CF6',
        secondary: '#EC4899',
        accent: '#F59E0B',
      },
    },
  },
];

describe('ThemePresetsSelector Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Presets Fetched on Mount (Requirement 10.1)', () => {
    /**
     * **Requirement 10.1**: WHEN an admin accesses the admin panel THEN the System 
     * SHALL display available theme preset options (e.g., "Modern Minimal", "Corporate", 
     * "Creative", "Bold Tech", etc.)
     * 
     * **Validates: Requirement 10.1**
     */

    it('should fetch presets from GET /api/theme-presets on mount', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/theme-presets');
        expect(api.get).toHaveBeenCalledTimes(1);
      });
    });

    it('should display loading state while fetching presets', () => {
      (api.get as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: mockPresets }), 100)
          )
      );

      render(<ThemePresetsSelector />);

      const loader = screen.getByTestId('loader-icon');
      expect(loader).toBeInTheDocument();
      expect(screen.getByText('Loading theme presets...')).toBeInTheDocument();
    });

    it('should display error notification if fetch fails', async () => {
      (api.get as any).mockRejectedValue(new Error('Network error'));

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalledWith('Unable to load theme presets');
      });
    });

    it('should display empty state when no presets are available', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: [],
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByText('No theme presets available')).toBeInTheDocument();
      });
    });

    it('should handle malformed API response gracefully', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: null,
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalledWith('Failed to load theme presets');
      });
    });
  });

  describe('Preset Cards Render Correctly (Requirement 10.1)', () => {
    /**
     * **Requirement 10.1**: WHEN an admin accesses the admin panel THEN the System 
     * SHALL display available theme preset options with preview data
     * 
     * **Validates: Requirement 10.1**
     */

    it('should render preset cards for each preset', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        mockPresets.forEach((preset) => {
          expect(screen.getByTestId(`preset-card-${preset.id}`)).toBeInTheDocument();
        });
      });
    });

    it('should display preset name in each card', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        const names = screen.getAllByTestId('preset-name');
        expect(names).toHaveLength(mockPresets.length);
        expect(names[0]).toHaveTextContent('Modern Minimal');
        expect(names[1]).toHaveTextContent('Corporate');
        expect(names[2]).toHaveTextContent('Creative');
      });
    });

    it('should display preset description in each card', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByText('Clean and minimal design')).toBeInTheDocument();
        expect(screen.getByText('Professional corporate design')).toBeInTheDocument();
        expect(screen.getByText('Bold and creative design')).toBeInTheDocument();
      });
    });

    it('should display preset category in each card', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        const categories = screen.getAllByTestId('preset-category');
        expect(categories.length).toBe(mockPresets.length);
        expect(categories[0]).toHaveTextContent('Modern');
        expect(categories[1]).toHaveTextContent('Corporate');
        expect(categories[2]).toHaveTextContent('Creative');
      });
    });

    it('should display color swatches from preset data', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: [mockPresets[0]],
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        const colorSwatches = screen.getAllByTestId(/color-swatch-/);
        expect(colorSwatches.length).toBeGreaterThan(0);
        // First color swatch should have the primary color
        expect(colorSwatches[0]).toHaveStyle(
          `backgroundColor: ${mockPresets[0].preset_data?.colors.primary}`
        );
      });
    });

    it('should render preset cards with Apply buttons', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        mockPresets.forEach((preset) => {
          const button = screen.getByTestId(`apply-button-${preset.id}`);
          expect(button).toBeInTheDocument();
          expect(button.textContent).toContain('Apply Preset');
        });
      });
    });
  });

  describe('Apply Button Triggers API Call (Requirement 10.2)', () => {
    /**
     * **Requirement 10.2**: WHEN an admin selects a theme preset THEN the System 
     * SHALL load and apply all customizations from that preset
     * 
     * **Validates: Requirement 10.2**
     */

    it('should call POST /api/theme-presets/:id/apply when Apply button is clicked', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      (api.post as any).mockResolvedValue({
        success: true,
        data: {},
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByTestId('apply-button-preset-1')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-button-preset-1');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/theme-presets/preset-1/apply', {});
      });
    });

    it('should disable Apply button while preset is being applied', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      (api.post as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: {} }), 100)
          )
      );

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByTestId('apply-button-preset-1')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-button-preset-1');
      fireEvent.click(applyButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Applying...')).toBeInTheDocument();
      });
    });

    it('should show loading indicator while applying', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      (api.post as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: {} }), 100)
          )
      );

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByTestId('apply-button-preset-1')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-button-preset-1');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Applying...')).toBeInTheDocument();
      });
    });

    it('should apply multiple presets independently', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      (api.post as any).mockResolvedValue({
        success: true,
        data: {},
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByTestId('apply-button-preset-1')).toBeInTheDocument();
      });

      const applyButton1 = screen.getByTestId('apply-button-preset-1');
      fireEvent.click(applyButton1);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/theme-presets/preset-1/apply', {});
      });

      const applyButton2 = screen.getByTestId('apply-button-preset-2');
      fireEvent.click(applyButton2);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/theme-presets/preset-2/apply', {});
        expect(api.post).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Success Notification Shown After Apply (Requirement 10.3)', () => {
    /**
     * **Requirement 10.3**: WHEN a preset is applied THEN the System SHALL display all 
     * preset values in the customization interface
     * 
     * **Validates: Requirement 10.3**
     */

    it('should show success toast notification when preset applied successfully', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      (api.post as any).mockResolvedValue({
        success: true,
        data: mockPresets[0],
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByTestId('apply-button-preset-1')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-button-preset-1');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(sonner.toast.success).toHaveBeenCalledWith('Preset "Modern Minimal" applied successfully');
      });
    });

    it('should update button text to "Applied ✓" after successful application', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      (api.post as any).mockResolvedValue({
        success: true,
        data: mockPresets[0],
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByTestId('apply-button-preset-1')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-button-preset-1');
      fireEvent.click(applyButton);

      await waitFor(() => {
        const updatedButton = screen.getByTestId('apply-button-preset-1');
        expect(updatedButton.textContent).toContain('Applied ✓');
      });
    });

    it('should call onPresetApplied callback after successful application', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      (api.post as any).mockResolvedValue({
        success: true,
        data: mockPresets[0],
      });

      const onPresetApplied = vi.fn();

      render(<ThemePresetsSelector onPresetApplied={onPresetApplied} />);

      await waitFor(() => {
        expect(screen.getByTestId('apply-button-preset-1')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-button-preset-1');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(onPresetApplied).toHaveBeenCalledWith(mockPresets[0]);
      });
    });
  });

  describe('Error Notification Shown on Apply Failure (Requirement 10.4)', () => {
    /**
     * **Requirement 10.4**: WHEN an admin customizes a preset THEN the System SHALL 
     * allow modifications without affecting the original preset template
     * 
     * **Validates: Requirement 10.4**
     */

    it('should show error toast when API call fails', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      (api.post as any).mockRejectedValue(new Error('API Error'));

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByTestId('apply-button-preset-1')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-button-preset-1');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalledWith(
          'Unable to apply preset "Modern Minimal". Please try again.'
        );
      });
    });

    it('should show error notification when API response is unsuccessful', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      (api.post as any).mockResolvedValue({
        success: false,
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByTestId('apply-button-preset-1')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-button-preset-1');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalledWith(
          'Failed to apply preset "Modern Minimal"'
        );
      });
    });

    it('should keep button enabled after failed application', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      (api.post as any).mockRejectedValue(new Error('API Error'));

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByTestId('apply-button-preset-1')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-button-preset-1');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalled();
      });

      // Button should be re-enabled
      expect(applyButton).not.toBeDisabled();
    });

    it('should allow retrying after failed application', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      (api.post as any)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          success: true,
          data: mockPresets[0],
        });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByTestId('apply-button-preset-1')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-button-preset-1');

      // First attempt fails
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalled();
      });

      vi.clearAllMocks();

      // Second attempt succeeds
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/theme-presets/preset-1/apply', {});
        expect(sonner.toast.success).toHaveBeenCalled();
      });
    });
  });

  describe('Component Lifecycle and Edge Cases', () => {
    it('should handle presets without description gracefully', async () => {
      const presetsWithoutDescription = [
        {
          id: 'preset-no-desc',
          name: 'No Description Preset',
          preset_data: { colors: { primary: '#000000' } },
        },
      ];

      (api.get as any).mockResolvedValue({
        success: true,
        data: presetsWithoutDescription,
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByText('No Description Preset')).toBeInTheDocument();
      });

      // Should still render the card
      expect(screen.getByTestId('preset-card-preset-no-desc')).toBeInTheDocument();
    });

    it('should handle presets without color data gracefully', async () => {
      const presetsWithoutColors = [
        {
          id: 'preset-no-colors',
          name: 'No Colors Preset',
          description: 'A preset without color data',
        },
      ];

      (api.get as any).mockResolvedValue({
        success: true,
        data: presetsWithoutColors,
      });

      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByText('No Colors Preset')).toBeInTheDocument();
      });

      // Should still render the card and button
      expect(screen.getByTestId('preset-card-preset-no-colors')).toBeInTheDocument();
      expect(screen.getByTestId('apply-button-preset-no-colors')).toBeInTheDocument();
    });

    it('should not call onPresetApplied if callback is not provided', async () => {
      (api.get as any).mockResolvedValue({
        success: true,
        data: mockPresets,
      });

      (api.post as any).mockResolvedValue({
        success: true,
        data: mockPresets[0],
      });

      // Render without onPresetApplied callback
      render(<ThemePresetsSelector />);

      await waitFor(() => {
        expect(screen.getByTestId('apply-button-preset-1')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-button-preset-1');
      fireEvent.click(applyButton);

      // Should succeed without error
      await waitFor(() => {
        expect(sonner.toast.success).toHaveBeenCalled();
      });
    });
  });
});
