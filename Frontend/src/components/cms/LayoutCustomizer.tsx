import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface LayoutValues {
  containerWidth: string; // e.g., "1200px" or "90%"
  containerLayout: 'full-width' | 'centered' | 'sidebar';
  padding: {
    heroSection: number;
    contentAreas: number;
    footer: number;
  };
  margins: {
    sectionSpacing: number;
    elementSpacing: number;
  };
  gaps: {
    grid: number;
    flex: number;
  };
}

export interface LayoutCustomizerProps {
  layout: LayoutValues;
  onChange: (layout: LayoutValues) => void;
  onPreviewUpdate?: (layout: LayoutValues) => void;
}

const LAYOUT_TYPES = [
  { value: 'full-width', label: 'Full Width' },
  { value: 'centered', label: 'Centered' },
  { value: 'sidebar', label: 'Sidebar' },
];

/**
 * LayoutCustomizer Component
 * Provides layout and spacing customization
 * Supports container width, layout types, and spacing configurations
 */
export default function LayoutCustomizer({
  layout,
  onChange,
  onPreviewUpdate,
}: LayoutCustomizerProps) {
  const [errors, setErrors] = useState<Set<string>>(new Set());

  // Validate numeric input for spacing
  const validateNumericSpacing = useCallback((value: string, min = 0, max = 500): boolean => {
    const num = parseInt(value);
    return !isNaN(num) && num >= min && num <= max;
  }, []);

  // Validate container width input (px or %)
  const validateContainerWidth = useCallback((value: string): boolean => {
    if (!value) return false;
    
    // Check for px format
    if (value.endsWith('px')) {
      const num = parseInt(value);
      return !isNaN(num) && num >= 100 && num <= 2000;
    }
    
    // Check for % format
    if (value.endsWith('%')) {
      const num = parseInt(value);
      return !isNaN(num) && num >= 50 && num <= 100;
    }
    
    return false;
  }, []);

  // Handle container width change
  const handleContainerWidthChange = useCallback(
    (value: string) => {
      if (!validateContainerWidth(value)) {
        setErrors((prev) => new Set(prev).add('containerWidth'));
        toast.error('Container width must be 100-2000px or 50-100%');
        return;
      }

      setErrors((prev) => {
        const next = new Set(prev);
        next.delete('containerWidth');
        return next;
      });

      const updated = {
        ...layout,
        containerWidth: value,
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [layout, onChange, onPreviewUpdate, validateContainerWidth]
  );

  // Handle container layout change
  const handleContainerLayoutChange = useCallback(
    (value: 'full-width' | 'centered' | 'sidebar') => {
      const updated = {
        ...layout,
        containerLayout: value,
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [layout, onChange, onPreviewUpdate]
  );

  // Handle padding change
  const handlePaddingChange = useCallback(
    (section: keyof typeof layout.padding, value: string) => {
      if (value === '') {
        setErrors((prev) => new Set(prev).add(`padding_${section}`));
        return;
      }

      if (!validateNumericSpacing(value, 0, 200)) {
        setErrors((prev) => new Set(prev).add(`padding_${section}`));
        toast.error('Padding must be between 0 and 200px');
        return;
      }

      setErrors((prev) => {
        const next = new Set(prev);
        next.delete(`padding_${section}`);
        return next;
      });

      const updated = {
        ...layout,
        padding: {
          ...layout.padding,
          [section]: parseInt(value),
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [layout, onChange, onPreviewUpdate, validateNumericSpacing]
  );

  // Handle margin change
  const handleMarginChange = useCallback(
    (marginType: keyof typeof layout.margins, value: string) => {
      if (value === '') {
        setErrors((prev) => new Set(prev).add(`margin_${marginType}`));
        return;
      }

      if (!validateNumericSpacing(value, 0, 300)) {
        setErrors((prev) => new Set(prev).add(`margin_${marginType}`));
        toast.error('Margin must be between 0 and 300px');
        return;
      }

      setErrors((prev) => {
        const next = new Set(prev);
        next.delete(`margin_${marginType}`);
        return next;
      });

      const updated = {
        ...layout,
        margins: {
          ...layout.margins,
          [marginType]: parseInt(value),
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [layout, onChange, onPreviewUpdate, validateNumericSpacing]
  );

  // Handle gap change
  const handleGapChange = useCallback(
    (gapType: keyof typeof layout.gaps, value: string) => {
      if (value === '') {
        setErrors((prev) => new Set(prev).add(`gap_${gapType}`));
        return;
      }

      if (!validateNumericSpacing(value, 0, 100)) {
        setErrors((prev) => new Set(prev).add(`gap_${gapType}`));
        toast.error('Gap must be between 0 and 100px');
        return;
      }

      setErrors((prev) => {
        const next = new Set(prev);
        next.delete(`gap_${gapType}`);
        return next;
      });

      const updated = {
        ...layout,
        gaps: {
          ...layout.gaps,
          [gapType]: parseInt(value),
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [layout, onChange, onPreviewUpdate, validateNumericSpacing]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Layout & Spacing Customization</CardTitle>
        <CardDescription>
          Configure container layout, widths, padding, margins, and gaps for your landing page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Container Settings */}
        <div className="space-y-4 pb-6 border-b">
          <h3 className="text-lg font-semibold">Container Settings</h3>

          {/* Container Width */}
          <div>
            <Label htmlFor="container-width" className="mb-2 block">
              Container Width (e.g., 1200px or 90%)
            </Label>
            <Input
              id="container-width"
              type="text"
              placeholder="1200px"
              value={layout.containerWidth}
              onChange={(e) => handleContainerWidthChange(e.target.value)}
              className={errors.has('containerWidth') ? 'border-red-500' : ''}
            />
            {errors.has('containerWidth') && (
              <p className="text-red-500 text-xs mt-1">
                Enter width in px (100-2000) or % (50-100)
              </p>
            )}
          </div>

          {/* Container Layout */}
          <div>
            <Label htmlFor="container-layout" className="mb-2 block">
              Container Layout
            </Label>
            <Select value={layout.containerLayout} onValueChange={handleContainerLayoutChange}>
              <SelectTrigger id="container-layout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAYOUT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Layout Preview */}
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Preview:</p>
            <div
              style={{
                display: 'flex',
                justifyContent:
                  layout.containerLayout === 'centered'
                    ? 'center'
                    : layout.containerLayout === 'sidebar'
                      ? 'flex-start'
                      : 'stretch',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: layout.containerWidth,
                  backgroundColor: '#E0E7FF',
                  border: '2px dashed #818CF8',
                  height: '60px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#4F46E5',
                  fontWeight: '500',
                }}
              >
                {layout.containerWidth}
              </div>
            </div>
          </div>
        </div>

        {/* Padding Settings */}
        <div className="space-y-4 pb-6 border-b">
          <h3 className="text-lg font-semibold">Padding</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="hero-padding" className="mb-2 block text-sm">
                Hero Section (px)
              </Label>
              <Input
                id="hero-padding"
                type="number"
                min="0"
                max="200"
                value={layout.padding.heroSection}
                onChange={(e) => handlePaddingChange('heroSection', e.target.value)}
                className={errors.has('padding_heroSection') ? 'border-red-500' : ''}
              />
              {errors.has('padding_heroSection') && (
                <p className="text-red-500 text-xs mt-1">Invalid padding</p>
              )}
            </div>

            <div>
              <Label htmlFor="content-padding" className="mb-2 block text-sm">
                Content Areas (px)
              </Label>
              <Input
                id="content-padding"
                type="number"
                min="0"
                max="200"
                value={layout.padding.contentAreas}
                onChange={(e) => handlePaddingChange('contentAreas', e.target.value)}
                className={errors.has('padding_contentAreas') ? 'border-red-500' : ''}
              />
              {errors.has('padding_contentAreas') && (
                <p className="text-red-500 text-xs mt-1">Invalid padding</p>
              )}
            </div>

            <div>
              <Label htmlFor="footer-padding" className="mb-2 block text-sm">
                Footer (px)
              </Label>
              <Input
                id="footer-padding"
                type="number"
                min="0"
                max="200"
                value={layout.padding.footer}
                onChange={(e) => handlePaddingChange('footer', e.target.value)}
                className={errors.has('padding_footer') ? 'border-red-500' : ''}
              />
              {errors.has('padding_footer') && (
                <p className="text-red-500 text-xs mt-1">Invalid padding</p>
              )}
            </div>
          </div>

          {/* Padding Preview */}
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Spacing Indicator:</p>
            <div className="space-y-2 text-xs text-gray-700">
              <div>Hero: {layout.padding.heroSection}px</div>
              <div>Content: {layout.padding.contentAreas}px</div>
              <div>Footer: {layout.padding.footer}px</div>
            </div>
          </div>
        </div>

        {/* Margin Settings */}
        <div className="space-y-4 pb-6 border-b">
          <h3 className="text-lg font-semibold">Margins</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="section-margin" className="mb-2 block text-sm">
                Section Spacing (px)
              </Label>
              <Input
                id="section-margin"
                type="number"
                min="0"
                max="300"
                value={layout.margins.sectionSpacing}
                onChange={(e) => handleMarginChange('sectionSpacing', e.target.value)}
                className={errors.has('margin_sectionSpacing') ? 'border-red-500' : ''}
              />
              {errors.has('margin_sectionSpacing') && (
                <p className="text-red-500 text-xs mt-1">Invalid margin</p>
              )}
            </div>

            <div>
              <Label htmlFor="element-margin" className="mb-2 block text-sm">
                Element Spacing (px)
              </Label>
              <Input
                id="element-margin"
                type="number"
                min="0"
                max="300"
                value={layout.margins.elementSpacing}
                onChange={(e) => handleMarginChange('elementSpacing', e.target.value)}
                className={errors.has('margin_elementSpacing') ? 'border-red-500' : ''}
              />
              {errors.has('margin_elementSpacing') && (
                <p className="text-red-500 text-xs mt-1">Invalid margin</p>
              )}
            </div>
          </div>

          {/* Margin Preview */}
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Spacing Indicator:</p>
            <div className="space-y-2">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${layout.margins.sectionSpacing}px`,
                }}
              >
                <div className="h-8 bg-blue-200 rounded text-xs flex items-center justify-center text-blue-700">
                  Section 1
                </div>
                <div className="h-8 bg-blue-200 rounded text-xs flex items-center justify-center text-blue-700">
                  Section 2
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gap Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Layout Gaps</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grid-gap" className="mb-2 block text-sm">
                Grid Gap (px)
              </Label>
              <Input
                id="grid-gap"
                type="number"
                min="0"
                max="100"
                value={layout.gaps.grid}
                onChange={(e) => handleGapChange('grid', e.target.value)}
                className={errors.has('gap_grid') ? 'border-red-500' : ''}
              />
              {errors.has('gap_grid') && (
                <p className="text-red-500 text-xs mt-1">Invalid gap</p>
              )}
            </div>

            <div>
              <Label htmlFor="flex-gap" className="mb-2 block text-sm">
                Flex Gap (px)
              </Label>
              <Input
                id="flex-gap"
                type="number"
                min="0"
                max="100"
                value={layout.gaps.flex}
                onChange={(e) => handleGapChange('flex', e.target.value)}
                className={errors.has('gap_flex') ? 'border-red-500' : ''}
              />
              {errors.has('gap_flex') && (
                <p className="text-red-500 text-xs mt-1">Invalid gap</p>
              )}
            </div>
          </div>

          {/* Gap Preview */}
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-xs text-gray-600 mb-3">Grid Layout Preview:</p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: `${layout.gaps.grid}px`,
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-green-200 rounded text-xs flex items-center justify-center text-green-700"
                >
                  Item {i}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
