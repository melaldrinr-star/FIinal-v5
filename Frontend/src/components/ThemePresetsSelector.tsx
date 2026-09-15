import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  category?: string;
  preset_data?: Record<string, any>;
}

export interface ThemePresetsSelectorProps {
  onPresetApplied?: (preset: ThemePreset) => void;
}

/**
 * ThemePresetsSelector Component
 * 
 * Displays available theme presets and allows users to apply them.
 * 
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
 */
export const ThemePresetsSelector: React.FC<ThemePresetsSelectorProps> = ({ 
  onPresetApplied 
}) => {
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedPresets, setAppliedPresets] = useState<Set<string>>(new Set());
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);

  // Fetch presets on mount
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        setLoading(true);
        const response = await api.get('/theme-presets');
        if (response.success && Array.isArray(response.data)) {
          setPresets(response.data);
        } else {
          toast.error('Failed to load theme presets');
        }
      } catch (error) {
        console.error('Failed to fetch theme presets:', error);
        toast.error('Unable to load theme presets');
      } finally {
        setLoading(false);
      }
    };

    fetchPresets();
  }, []);

  // Handle preset application
  const handleApplyPreset = async (preset: ThemePreset) => {
    try {
      setApplyingPresetId(preset.id);
      const response = await api.post(`/theme-presets/${preset.id}/apply`, {});
      
      if (response.success) {
        setAppliedPresets(prev => new Set([...prev, preset.id]));
        toast.success(`Preset "${preset.name}" applied successfully`);
        
        // Call the callback if provided
        if (onPresetApplied) {
          onPresetApplied(preset);
        }
      } else {
        toast.error(`Failed to apply preset "${preset.name}"`);
      }
    } catch (error) {
      console.error(`Error applying preset ${preset.id}:`, error);
      toast.error(`Unable to apply preset "${preset.name}". Please try again.`);
    } finally {
      setApplyingPresetId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading theme presets...</span>
      </div>
    );
  }

  if (presets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No theme presets available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {presets.map((preset) => (
        <div
          key={preset.id}
          className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          data-testid={`preset-card-${preset.id}`}
        >
          {/* Preset Preview Colors */}
          {preset.preset_data?.colors && (
            <div className="flex gap-2 mb-4">
              {[
                preset.preset_data.colors.primary,
                preset.preset_data.colors.secondary,
                preset.preset_data.colors.accent,
              ]
                .filter(Boolean)
                .slice(0, 3)
                .map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: color }}
                    data-testid={`color-swatch-${index}`}
                  />
                ))}
            </div>
          )}

          {/* Preset Name and Description */}
          <h3 className="text-lg font-semibold mb-2" data-testid="preset-name">
            {preset.name}
          </h3>
          {preset.description && (
            <p className="text-sm text-gray-600 mb-4" data-testid="preset-description">
              {preset.description}
            </p>
          )}
          {preset.category && (
            <p className="text-xs text-gray-500 mb-4" data-testid="preset-category">
              {preset.category}
            </p>
          )}

          {/* Apply Button */}
          <button
            onClick={() => handleApplyPreset(preset)}
            disabled={applyingPresetId !== null}
            data-testid={`apply-button-${preset.id}`}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {applyingPresetId === preset.id ? (
              <>
                <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : appliedPresets.has(preset.id) ? (
              'Applied ✓'
            ) : (
              'Apply Preset'
            )}
          </button>
        </div>
      ))}
    </div>
  );
};

export default ThemePresetsSelector;
