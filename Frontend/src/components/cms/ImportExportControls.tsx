import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { CMSSettings } from '../../services/cmsSettingsService';

export interface ImportExportControlsProps {
  onImportSuccess?: (settings: CMSSettings) => void;
}

interface PreviewSettings {
  colors?: Record<string, any>;
  typography?: Record<string, any>;
  layout?: Record<string, any>;
  components?: Record<string, any>;
  content?: Record<string, any>;
}

export default function ImportExportControls({ onImportSuccess }: ImportExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [mergeStrategy, setMergeStrategy] = useState<'overwrite' | 'merge'>('overwrite');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<PreviewSettings | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export settings as JSON file
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.post('/cms-settings/export', {});
      
      if (!response.success || !response.data) {
        toast.error('Export failed');
        return;
      }

      // Create JSON file
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `cms-export-${timestamp}.json`;
      
      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Settings exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export settings');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      toast.error('Please upload a JSON file');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error('File size must be less than 1MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Parse and validate file content
    try {
      const fileContent = await file.text();
      const importData = JSON.parse(fileContent);
      
      // Validate JSON structure
      validateImportFile(importData);
      
      setUploadedFile(file);
      setImportPreview(generatePreview(importData));
      setValidationErrors([]);
      toast.success('File loaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON file';
      const errors = [errorMessage];
      setValidationErrors(errors);
      toast.error(errorMessage);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadedFile(null);
      setImportPreview(null);
    }
  };

  // Validate import file structure
  const validateImportFile = (data: any) => {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid file format: must be a JSON object');
    }

    // Check for required fields or at least some customization data
    const hasValidData = data.hero || data.appearance || data.mission || data.vision || 
                        data.contact || data.footer || data.colors || data.typography;
    
    if (!hasValidData) {
      throw new Error('File does not contain valid customization settings');
    }

    // Validate specific sections if present
    if (data.hero && typeof data.hero !== 'object') {
      errors.push('Hero section must be an object');
    }

    if (data.appearance && typeof data.appearance !== 'object') {
      errors.push('Appearance section must be an object');
    }

    if (data.contact && typeof data.contact !== 'object') {
      errors.push('Contact section must be an object');
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  };

  // Generate preview from import data
  const generatePreview = (data: any): PreviewSettings => {
    return {
      hero: data.hero,
      appearance: data.appearance,
      mission: data.mission,
      vision: data.vision,
      contact: data.contact,
      footer: data.footer,
      colors: data.colors,
      typography: data.typography,
      layout: data.layout,
      components: data.components,
      content: data.content,
    };
  };

  // Perform the actual import
  const performImport = async () => {
    if (!uploadedFile) return;

    setIsImporting(true);
    try {
      const fileContent = await uploadedFile.text();
      const importData = JSON.parse(fileContent);

      const response = await api.post('/cms-settings/import', {
        importData,
        mergeStrategy,
      });

      if (!response.success) {
        throw new Error(response.error || 'Import failed');
      }

      setUploadedFile(null);
      setImportPreview(null);
      setValidationErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowConfirmDialog(false);

      toast.success('Settings imported successfully');
      
      // Call callback if provided
      if (onImportSuccess && response.data) {
        onImportSuccess(response.data as CMSSettings);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      setValidationErrors([errorMessage]);
      toast.error(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  // Clear upload
  const handleClearUpload = () => {
    setUploadedFile(null);
    setImportPreview(null);
    setValidationErrors([]);
    setMergeStrategy('overwrite');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import / Export Settings</CardTitle>
        <CardDescription>
          Export your customization settings or import settings from another instance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Export Settings</Label>
            <Badge variant="outline">JSON Format</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Download your current customization settings as a JSON file for backup or sharing.
          </p>
          <Button onClick={handleExport} disabled={isExporting} className="w-full">
            <Download className="mr-2 size-4" />
            {isExporting ? 'Exporting...' : 'Export Settings'}
          </Button>
        </div>

        <div className="border-t pt-6" />

        {/* Import Section */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Import Settings</Label>
            <p className="text-sm text-muted-foreground mt-0.5">
              Upload a JSON file containing customization settings to import them.
            </p>
          </div>

          {/* File Upload Input */}
          {!uploadedFile && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="flex-1"
                  data-testid="file-input"
                />
                <Button variant="outline" disabled={isImporting}>
                  <Upload className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex gap-2">
                <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-semibold text-red-900">Validation Errors</p>
                  <ul className="text-sm text-red-800 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* File Loaded State */}
          {uploadedFile && (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex gap-2">
                  <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">File Loaded</p>
                    <p className="text-sm text-green-800 mt-1">{uploadedFile.name}</p>
                  </div>
                </div>
              </div>

              {/* Import Preview */}
              {importPreview && (
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <p className="font-semibold text-sm">Preview of Import Data:</p>
                  <div className="space-y-2 text-xs text-muted-foreground max-h-48 overflow-y-auto">
                    {importPreview.hero && (
                      <div>
                        <p className="font-medium text-foreground">Hero Section:</p>
                        <p className="ml-2">• Title: {importPreview.hero.title || '(empty)'}</p>
                        <p className="ml-2">• Badge: {importPreview.hero.badge || '(empty)'}</p>
                      </div>
                    )}
                    {importPreview.appearance && (
                      <div>
                        <p className="font-medium text-foreground">Appearance:</p>
                        <p className="ml-2">• Logo: {importPreview.appearance.logo ? 'Present' : 'Not set'}</p>
                        <p className="ml-2">• Hero Background: {importPreview.appearance.heroBackground ? 'Present' : 'Not set'}</p>
                      </div>
                    )}
                    {(importPreview.mission || importPreview.vision) && (
                      <div>
                        <p className="font-medium text-foreground">Mission & Vision:</p>
                        <p className="ml-2">• Mission: {importPreview.mission ? 'Present' : 'Not set'}</p>
                        <p className="ml-2">• Vision: {importPreview.vision ? 'Present' : 'Not set'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Merge Strategy Selector */}
              <div className="space-y-2">
                <Label htmlFor="merge-strategy" className="text-sm font-medium">
                  Merge Strategy
                </Label>
                <Select value={mergeStrategy} onValueChange={(value: any) => setMergeStrategy(value)}>
                  <SelectTrigger id="merge-strategy" data-testid="merge-strategy-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overwrite">
                      <span>Overwrite (replace all settings)</span>
                    </SelectItem>
                    <SelectItem value="merge">
                      <span>Merge (preserve unmodified settings)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {mergeStrategy === 'overwrite'
                    ? 'All current settings will be replaced with the imported settings.'
                    : 'Only settings present in the import file will be updated.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isImporting}
                  className="flex-1"
                >
                  Confirm Import
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearUpload}
                  disabled={isImporting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              {mergeStrategy === 'overwrite'
                ? 'This will replace all your current settings with the imported settings. This action cannot be undone.'
                : 'This will merge the imported settings with your current settings. Settings from the import file will override current values.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            <p>Merge Strategy: <span className="font-semibold">{mergeStrategy === 'overwrite' ? 'Overwrite' : 'Merge'}</span></p>
            <p>File: <span className="font-semibold">{uploadedFile?.name}</span></p>
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performImport}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Confirm Import'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
