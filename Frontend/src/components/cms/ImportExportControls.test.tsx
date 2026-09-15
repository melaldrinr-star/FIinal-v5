import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportExportControls from './ImportExportControls';
import { api } from '../../services/api';
import { toast } from 'sonner';

// Mock the API module
vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
  getFileUrl: vi.fn((path) => `http://example.com/${path}`),
}));

// Mock the toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Sample test data
const sampleExportData = {
  hero: {
    badge: 'Quality Training',
    title: 'Learn & Grow',
    subtitle: 'Transform your future',
    ctaPrimary: 'Enroll Now',
    ctaSecondary: 'Browse',
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

/**
 * **Component Tests: ImportExportControls**
 * 
 * Tests the ImportExportControls component for export/import functionality including:
 * - Test export generates JSON file
 * - Test import file upload works
 * - Test file validation errors shown
 * - Test merge strategy selector works
 * - Test import confirmation shows preview
 * - Test successful import updates settings
 * 
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**
 */

describe('ImportExportControls Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Export Functionality', () => {
    it('should render export button', () => {
      render(<ImportExportControls />);
      const exportButton = screen.getByRole('button', { name: /export settings/i });
      expect(exportButton).toBeInTheDocument();
    });

    it('should generate JSON file on export', async () => {
      // Mock the API to return sample data
      (api.post as any).mockResolvedValue({
        success: true,
        data: sampleExportData,
      });

      // Mock URL and document methods
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://example.com/test');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      render(<ImportExportControls />);
      const exportButton = screen.getByRole('button', { name: /export settings/i });

      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/cms-settings/export', {});
        expect(createObjectURLSpy).toHaveBeenCalled();
      });

      expect(toast.success).toHaveBeenCalledWith('Settings exported successfully');

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should display error on export failure', async () => {
      (api.post as any).mockResolvedValue({
        success: false,
      });

      render(<ImportExportControls />);
      const exportButton = screen.getByRole('button', { name: /export settings/i });

      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Export failed');
      });
    });

    it('should disable export button while exporting', async () => {
      (api.post as any).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve({ success: true, data: sampleExportData }), 500);
        })
      );

      render(<ImportExportControls />);
      const exportButton = screen.getByRole('button', { name: /export settings/i });

      fireEvent.click(exportButton);

      expect(exportButton).toBeDisabled();

      await waitFor(
        () => {
          expect(exportButton).not.toBeDisabled();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('File Upload and Validation', () => {
    it('should accept JSON file upload', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      await waitFor(() => {
        expect(screen.getByText('File Loaded')).toBeInTheDocument();
        expect(screen.getByText('settings.json')).toBeInTheDocument();
      });
    });

    it('should reject non-JSON files', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const csvFile = new File(['data'], 'settings.csv', { type: 'text/csv' });

      await user.upload(fileInput, csvFile);

      expect(toast.error).toHaveBeenCalledWith('Please upload a JSON file');
    });

    it('should reject files larger than 1MB', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      // Create a large blob (over 1MB)
      const largeContent = new Array(1024 * 1024 + 1).fill('a').join('');
      const largeFile = new File([largeContent], 'large.json', { type: 'application/json' });

      await user.upload(fileInput, largeFile);

      expect(toast.error).toHaveBeenCalledWith('File size must be less than 1MB');
    });

    it('should display validation error for invalid JSON', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const invalidFile = new File(['{ invalid json }'], 'invalid.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByText('Validation Errors')).toBeInTheDocument();
      });
    });

    it('should display validation error for empty JSON object', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const emptyFile = new File(['{}'], 'empty.json', { type: 'application/json' });

      await user.upload(fileInput, emptyFile);

      await waitFor(() => {
        expect(screen.getByText('Validation Errors')).toBeInTheDocument();
      });
    });

    it('should accept file with partial data (only hero section)', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const partialData = JSON.stringify({
        hero: {
          title: 'Test Title',
          badge: 'Test Badge',
        },
      });
      const partialFile = new File([partialData], 'partial.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, partialFile);

      await waitFor(() => {
        expect(screen.getByText('File Loaded')).toBeInTheDocument();
        expect(screen.queryByText('Validation Errors')).not.toBeInTheDocument();
      });
    });

    it('should show validation errors for malformed structure', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const invalidData = JSON.stringify({
        hero: 'not an object',
      });
      const invalidFile = new File([invalidData], 'invalid-structure.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByText('Validation Errors')).toBeInTheDocument();
      });
    });
  });

  describe('Merge Strategy Selector', () => {
    it('should display merge strategy selector when file is loaded', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      await waitFor(() => {
        expect(screen.getByTestId('merge-strategy-select')).toBeInTheDocument();
      });
    });

    it('should default to overwrite strategy', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      await waitFor(() => {
        expect(screen.getByText(/replace all settings/i)).toBeInTheDocument();
      });
    });

    it('should allow switching to merge strategy', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      await waitFor(() => {
        expect(screen.getByTestId('merge-strategy-select')).toBeInTheDocument();
      });

      const strategySelect = screen.getByTestId('merge-strategy-select');
      fireEvent.click(strategySelect);

      const mergeOption = screen.getByRole('option', { name: /merge.*preserve/i });
      fireEvent.click(mergeOption);

      await waitFor(() => {
        expect(screen.getByText(/only settings present in the import file will be updated/i)).toBeInTheDocument();
      });
    });

    it('should display correct description for overwrite strategy', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      await waitFor(() => {
        expect(screen.getByText(/replace all settings will be replaced/i)).toBeInTheDocument();
      });
    });
  });

  describe('Import Preview', () => {
    it('should display preview of imported data', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      await waitFor(() => {
        expect(screen.getByText('Preview of Import Data:')).toBeInTheDocument();
      });

      // Verify preview shows key data
      expect(screen.getByText(/title: learn & grow/i)).toBeInTheDocument();
      expect(screen.getByText(/badge: quality training/i)).toBeInTheDocument();
    });

    it('should show preview with partial data', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const partialData = JSON.stringify({
        hero: {
          title: 'Only Hero',
          badge: 'Partial',
        },
      });
      const partialFile = new File([partialData], 'partial.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, partialFile);

      await waitFor(() => {
        expect(screen.getByText('Preview of Import Data:')).toBeInTheDocument();
        expect(screen.getByText(/title: only hero/i)).toBeInTheDocument();
      });
    });

    it('should indicate when appearance assets are present', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      await waitFor(() => {
        expect(screen.getByText(/logo: present/i)).toBeInTheDocument();
        expect(screen.getByText(/hero background: present/i)).toBeInTheDocument();
      });
    });
  });

  describe('Import Confirmation Dialog', () => {
    it('should display confirm button after file loaded', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm import/i })).toBeInTheDocument();
      });
    });

    it('should show merge strategy in confirmation', async () => {
      const user = userEvent.setup();
      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: sampleExportData,
      });

      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm import/i })).toBeInTheDocument();
      });

      // Click confirm
      const confirmButton = screen.getByRole('button', { name: /confirm import/i });
      fireEvent.click(confirmButton);

      // Dialog should appear with confirmation details
      await waitFor(() => {
        expect(screen.getByText(/merge strategy: overwrite/i)).toBeInTheDocument();
      });
    });

    it('should perform import with correct merge strategy', async () => {
      const user = userEvent.setup();
      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: sampleExportData,
      });

      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm import/i })).toBeInTheDocument();
      });

      // Click confirm to show dialog
      const confirmButton = screen.getByRole('button', { name: /confirm import/i });
      fireEvent.click(confirmButton);

      // Click the dialog's action button (Confirm Import in dialog)
      await waitFor(() => {
        const confirmButtons = screen.getAllByRole('button', { name: /confirm import/i });
        // The dialog confirmation button should be the last one
        fireEvent.click(confirmButtons[confirmButtons.length - 1]);
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/cms-settings/import', {
          importData: sampleExportData,
          mergeStrategy: 'overwrite',
        });
      });
    });
  });

  describe('Successful Import', () => {
    it('should display success message after import', async () => {
      const user = userEvent.setup();
      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: sampleExportData,
      });

      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      const confirmButton = screen.getByRole('button', { name: /confirm import/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const confirmButtons = screen.getAllByRole('button', { name: /confirm import/i });
        fireEvent.click(confirmButtons[confirmButtons.length - 1]);
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Settings imported successfully');
      });
    });

    it('should call onImportSuccess callback after successful import', async () => {
      const user = userEvent.setup();
      const mockCallback = vi.fn();

      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: sampleExportData,
      });

      render(<ImportExportControls onImportSuccess={mockCallback} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      const confirmButton = screen.getByRole('button', { name: /confirm import/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const confirmButtons = screen.getAllByRole('button', { name: /confirm import/i });
        fireEvent.click(confirmButtons[confirmButtons.length - 1]);
      });

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith(sampleExportData);
      });
    });

    it('should clear upload state after successful import', async () => {
      const user = userEvent.setup();
      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: sampleExportData,
      });

      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      expect(screen.getByText('File Loaded')).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /confirm import/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const confirmButtons = screen.getAllByRole('button', { name: /confirm import/i });
        fireEvent.click(confirmButtons[confirmButtons.length - 1]);
      });

      await waitFor(() => {
        expect(screen.queryByText('File Loaded')).not.toBeInTheDocument();
      });
    });
  });

  describe('Import Error Handling', () => {
    it('should display error on import failure', async () => {
      const user = userEvent.setup();
      (api.post as any).mockResolvedValueOnce({
        success: false,
        error: 'Import validation failed',
      });

      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      const confirmButton = screen.getByRole('button', { name: /confirm import/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const confirmButtons = screen.getAllByRole('button', { name: /confirm import/i });
        fireEvent.click(confirmButtons[confirmButtons.length - 1]);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Import validation failed');
      });
    });
  });

  describe('Cancel and Clear Operations', () => {
    it('should clear upload on Cancel button click', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, jsonFile);

      await waitFor(() => {
        expect(screen.getByText('File Loaded')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('File Loaded')).not.toBeInTheDocument();
      });
    });

    it('should reset merge strategy to overwrite after cancel', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const jsonFile = new File([JSON.stringify(sampleExportData)], 'settings.json', {
        type: 'application/json',
      });

      // Upload and change strategy
      await user.upload(fileInput, jsonFile);

      const strategySelect = screen.getByTestId('merge-strategy-select');
      fireEvent.click(strategySelect);
      const mergeOption = screen.getByRole('option', { name: /merge.*preserve/i });
      fireEvent.click(mergeOption);

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Upload again
      await user.upload(fileInput, jsonFile);

      // Should be back to overwrite
      await waitFor(() => {
        expect(screen.getByText(/replace all settings/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when uploading new file', async () => {
      const user = userEvent.setup();
      render(<ImportExportControls />);

      // Upload invalid file
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const invalidFile = new File(['{}'], 'empty.json', { type: 'application/json' });

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByText('Validation Errors')).toBeInTheDocument();
      });

      // Upload valid file
      const validFile = new File([JSON.stringify(sampleExportData)], 'valid.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, validFile);

      await waitFor(() => {
        expect(screen.queryByText('Validation Errors')).not.toBeInTheDocument();
        expect(screen.getByText('File Loaded')).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('should render both export and import sections', () => {
      render(<ImportExportControls />);

      expect(screen.getByRole('button', { name: /export settings/i })).toBeInTheDocument();
      expect(screen.getByTestId('file-input')).toBeInTheDocument();
    });

    it('should maintain independent state for export and import', async () => {
      (api.post as any).mockResolvedValue({
        success: true,
        data: sampleExportData,
      });

      render(<ImportExportControls />);

      // Export button should exist
      const exportButton = screen.getByRole('button', { name: /export settings/i });
      expect(exportButton).toBeInTheDocument();

      // File input should exist
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      // Both sections should be independently accessible
      expect(exportButton).toBeEnabled();
    });
  });
});
