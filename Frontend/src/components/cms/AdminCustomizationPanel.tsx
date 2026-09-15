import { useState, useEffect, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, AlertCircle, CheckCircle2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import cmsSettingsService, { CMSSettings } from '../../services/cmsSettingsService';

// Import customizer components
import ColorCustomizer from './ColorCustomizer';
import TypographyCustomizer from './TypographyCustomizer';
import LayoutCustomizer from './LayoutCustomizer';
import ComponentToggler from './ComponentToggler';
import ContentEditor from './ContentEditor';
import PreviewPanel from './PreviewPanel';

// Lazy load heavy sub-components to avoid import errors
const ImportExportControls = lazy(() => 
  import('./ImportExportControls').catch(err => {
    console.warn('Failed to load ImportExportControls:', err);
    return { default: () => <p className="text-muted-foreground">Import/Export unavailable</p> };
  })
);

const VersionHistoryPanel = lazy(() => 
  import('./VersionHistoryPanel').catch(err => {
    console.warn('Failed to load VersionHistoryPanel:', err);
    return { default: () => <p className="text-muted-foreground">Version history unavailable</p> };
  })
);

const AuditLogViewer = lazy(() => 
  import('../AuditLogViewer').then(m => ({ default: m.AuditLogViewer }))
    .catch(err => {
      console.warn('Failed to load AuditLogViewer:', err);
      return { default: () => <p className="text-muted-foreground">Audit log viewer unavailable</p> };
    })
);

// Lazy load theme presets component
const ThemePresetsPanel = lazy(() => 
  import('./ThemePresetsPanel').catch(err => {
    console.warn('Failed to load ThemePresetsPanel:', err);
    return { default: () => <p className="text-muted-foreground">Theme presets unavailable</p> };
  })
);



export interface AdminCustomizationPanelProps {
  onSaveSuccess?: (settings: CMSSettings) => void;
  onError?: (error: Error) => void;
}

const emptySettings: CMSSettings = {
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#1F2937',
    borders: '#E5E7EB',
  },
  typography: {
    headings: {
      fontFamily: 'Poppins',
      fontSize: { h1: 48, h2: 36, h3: 28 },
      fontWeight: 700,
      lineHeight: 1.2,
    },
    body: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },
  layout: {
    containerWidth: '1200px',
    containerLayout: 'centered',
    padding: { heroSection: 40, contentAreas: 32, footer: 24 },
    margins: { sectionSpacing: 48, elementSpacing: 16 },
    gaps: { grid: 24, flex: 16 },
  },
  components: {
    navigation: { enabled: true },
    hero: { enabled: true },
    features: { enabled: true },
    testimonials: { enabled: true },
    ctaSection: { enabled: true },
    contact: { enabled: true },
    footer: { enabled: true },
  },
  content: {
    hero: {
      heading: 'Welcome to Our Platform',
      subheading: 'Build amazing things',
      ctaText: 'Get Started',
    },
    missionVision: {
      title: 'Our Mission',
      description: 'To empower businesses...',
      vision: 'To be the leading...',
    },
    features: [],
    testimonials: [],
    contact: {
      email: 'contact@example.com',
      phone: '',
      address: '',
      socialLinks: {},
    },
  },
  // Backward compatibility fields
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

export default function AdminCustomizationPanel({ onSaveSuccess, onError }: AdminCustomizationPanelProps) {
  const [settings, setSettings] = useState<CMSSettings>(emptySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('colors');

  const normalizeSettings = (saved: Partial<CMSSettings>): CMSSettings => {
    const defaults = { ...emptySettings };
    
    return {
      // New comprehensive structure fields
      colors: { ...defaults.colors, ...(saved?.colors || {}) },
      typography: { 
        ...defaults.typography,
        headings: { ...defaults.typography?.headings, ...(saved?.typography?.headings || {}) },
        body: { ...defaults.typography?.body, ...(saved?.typography?.body || {}) },
      },
      layout: { 
        ...defaults.layout,
        padding: { ...defaults.layout?.padding, ...(saved?.layout?.padding || {}) },
        margins: { ...defaults.layout?.margins, ...(saved?.layout?.margins || {}) },
        gaps: { ...defaults.layout?.gaps, ...(saved?.layout?.gaps || {}) },
      },
      components: { ...defaults.components, ...(saved?.components || {}) },
      content: {
        ...defaults.content,
        contact: { ...defaults.content?.contact, ...(saved?.content?.contact || {}) },
      },
      // Backward compatibility fields
      hero: { ...defaults.hero, ...(saved?.hero || {}) },
      appearance: { ...defaults.appearance, ...(saved?.appearance || {}) },
      mission: saved?.mission || defaults.mission,
      vision: saved?.vision || defaults.vision,
      contact: { ...defaults.contact, ...(saved?.contact || {}) },
      footer: { ...defaults.footer, ...(saved?.footer || {}) },
    };
  };

  // Fetch customizations on component mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await cmsSettingsService.getSettings();
        if (data) {
          const parsed = normalizeSettings(data);
          setSettings(parsed);
        } else {
          setSettings(emptySettings);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
        setError(errorMessage);
        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [onError]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await cmsSettingsService.updateSettings(settings);
      localStorage.setItem('bmdc-cms-settings', JSON.stringify(settings));
      toast.success('Settings saved successfully!');
      if (onSaveSuccess) {
        onSaveSuccess(settings);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
      try {
        setSettings(emptySettings);
        await cmsSettingsService.updateSettings(emptySettings);
        localStorage.setItem('bmdc-cms-settings', JSON.stringify(emptySettings));
        toast.success('Settings reset to default');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings';
        setError(errorMessage);
        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="w-full space-y-6" data-testid="admin-customization-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Landing Page Customization</h2>
          <p className="text-muted-foreground">Customize your landing page appearance, content, and components</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving || isLoading}>
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading} data-testid="save-button">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span className="text-muted-foreground">Loading customization settings...</span>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State Indicator */}
      {!error && !isLoading && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-2 py-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">Settings loaded successfully</span>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {!isLoading && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-testid="customization-tabs">
          <TabsList className="grid grid-cols-3 lg:grid-cols-9 w-full">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="import-export">Import/Export</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4" data-testid="colors-tab">
            <Card>
              <CardHeader>
                <CardTitle>Color Customization</CardTitle>
                <CardDescription>Customize primary, secondary, and accent colors</CardDescription>
              </CardHeader>
              <CardContent>
                <ColorCustomizer
                  colors={settings.colors}
                  onChange={(updatedColors) => setSettings({ ...settings, colors: updatedColors })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-4" data-testid="typography-tab">
            <Card>
              <CardHeader>
                <CardTitle>Typography Customization</CardTitle>
                <CardDescription>Customize fonts, sizes, and weights</CardDescription>
              </CardHeader>
              <CardContent>
                <TypographyCustomizer
                  typography={settings.typography}
                  onChange={(updatedTypography) => setSettings({ ...settings, typography: updatedTypography })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-4" data-testid="layout-tab">
            <Card>
              <CardHeader>
                <CardTitle>Layout & Spacing</CardTitle>
                <CardDescription>Customize container width, padding, and spacing</CardDescription>
              </CardHeader>
              <CardContent>
                <LayoutCustomizer
                  layout={settings.layout}
                  onChange={(updatedLayout) => setSettings({ ...settings, layout: updatedLayout })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-4" data-testid="components-tab">
            <Card>
              <CardHeader>
                <CardTitle>Component Visibility</CardTitle>
                <CardDescription>Enable or disable page components</CardDescription>
              </CardHeader>
              <CardContent>
                <ComponentToggler
                  components={settings.components}
                  onChange={(updatedComponents) => setSettings({ ...settings, components: updatedComponents })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4" data-testid="content-tab">
            <Card>
              <CardHeader>
                <CardTitle>Content Customization</CardTitle>
                <CardDescription>Edit page content sections</CardDescription>
              </CardHeader>
              <CardContent>
                <ContentEditor
                  content={settings.content}
                  onChange={(updatedContent) => setSettings({ ...settings, content: updatedContent })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-4" data-testid="presets-tab">
            <Card>
              <CardHeader>
                <CardTitle>Theme Presets</CardTitle>
                <CardDescription>Apply pre-configured themes</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<p className="text-muted-foreground">Loading theme presets...</p>}>
                  <ThemePresetsPanel
                    onPresetApply={(presetSettings) => {
                      setSettings(normalizeSettings(presetSettings));
                      toast.success('Theme preset applied!');
                    }}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import/Export Tab */}
          <TabsContent value="import-export" className="space-y-4" data-testid="import-export-tab">
            <Card>
              <CardHeader>
                <CardTitle>Import/Export</CardTitle>
                <CardDescription>Export settings or import from file</CardDescription>
              </CardHeader>
              <CardContent>
                <ImportExportControls
                  onImportSuccess={(newSettings) => {
                    setSettings(normalizeSettings(newSettings));
                    toast.success('Settings imported successfully');
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions" className="space-y-4" data-testid="versions-tab">
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
                <CardDescription>View and restore previous versions</CardDescription>
              </CardHeader>
              <CardContent>
                <VersionHistoryPanel
                  onRollbackSuccess={(newSettings) => {
                    setSettings(normalizeSettings(newSettings));
                    toast.success('Rolled back to previous version');
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-4" data-testid="audit-tab">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>View all configuration changes</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<p className="text-muted-foreground">Loading audit logs...</p>}>
                  <AuditLogViewer />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Footer Actions */}
      {!isLoading && (
        <div className="flex justify-end gap-2 border-t pt-6">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={isSaving} size="lg" data-testid="save-button-footer">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
