import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { CMSSettings } from '../../services/cmsSettingsService';

interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  preset_data?: Partial<CMSSettings>;
}

interface ThemePresetsPanelProps {
  onPresetApply?: (settings: Partial<CMSSettings>) => void;
}

export default function ThemePresetsPanel({ onPresetApply }: ThemePresetsPanelProps) {
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch available theme presets
  useEffect(() => {
    const loadPresets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/theme-presets');
        if (response.success && response.data) {
          setPresets(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load theme presets';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadPresets();
  }, []);

  const handleApplyPreset = async (presetId: string) => {
    setApplying(presetId);
    try {
      const response = await api.post(`/theme-presets/${presetId}/apply`, {});
      if (response.success) {
        const preset = presets.find(p => p.id === presetId);
        if (preset?.preset_data && onPresetApply) {
          onPresetApply(preset.preset_data);
        }
        toast.success(`${preset?.name || 'Theme'} applied successfully!`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply preset';
      toast.error(errorMessage);
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span className="text-muted-foreground">Loading theme presets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (presets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No theme presets available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>Select a pre-configured theme to instantly update your landing page appearance. Each theme includes optimized colors, typography, and layout settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <Card key={preset.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg">{preset.name}</CardTitle>
                  {preset.category && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {preset.category}
                    </Badge>
                  )}
                </div>
              </div>
              {preset.description && (
                <CardDescription className="text-xs mt-1">
                  {preset.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="flex-1 pb-3">
              {preset.preset_data && (
                <div className="space-y-2">
                  {/* Color Preview */}
                  {preset.preset_data.colors && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">Colors</p>
                      <div className="flex gap-1">
                        {Object.entries(preset.preset_data.colors).map(([key, color]) => (
                          <div
                            key={key}
                            className="h-6 w-6 rounded border border-border"
                            style={{ backgroundColor: color as string }}
                            title={key}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Typography Preview */}
                  {preset.preset_data.typography && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">Typography</p>
                      <p className="text-xs text-muted-foreground">
                        {preset.preset_data.typography.headings?.fontFamily || 'Default'} / {preset.preset_data.typography.body?.fontFamily || 'Default'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <div className="border-t pt-3">
              <Button
                onClick={() => handleApplyPreset(preset.id)}
                disabled={applying === preset.id}
                className="w-full"
                variant="default"
              >
                {applying === preset.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Apply Theme
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
