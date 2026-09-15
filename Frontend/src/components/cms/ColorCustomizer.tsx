import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AlertCircle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  parseColor,
  isValidColor,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToString,
  hslToString,
  RGBColor,
  HSLColor,
} from '../../utils/colorConverter';

export interface ColorValues {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  borders: string;
}

export interface ColorCustomizerProps {
  colors: ColorValues;
  onChange: (colors: ColorValues) => void;
  onPreviewUpdate?: (colors: ColorValues) => void;
}

const COLOR_DEFINITIONS = [
  { key: 'primary', label: 'Primary Color', description: 'Main brand color' },
  { key: 'secondary', label: 'Secondary Color', description: 'Complementary color' },
  { key: 'accent', label: 'Accent Color', description: 'Highlight and CTA color' },
  { key: 'background', label: 'Background Color', description: 'Page background' },
  { key: 'text', label: 'Text Color', description: 'Primary text color' },
  { key: 'borders', label: 'Border Color', description: 'Border and divider color' },
] as const;

/**
 * ColorCustomizer Component
 * Provides color picker interface with support for hex, RGB, and HSL formats
 * Displays color swatches and supports live preview updates
 */
export default function ColorCustomizer({
  colors,
  onChange,
  onPreviewUpdate,
}: ColorCustomizerProps) {
  const [expandedColor, setExpandedColor] = useState<keyof ColorValues | null>('primary');
  const [inputValues, setInputValues] = useState<Record<string, string>>(colors);
  const [invalidColors, setInvalidColors] = useState<Set<string>>(new Set());
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Update input values when colors prop changes
  const handleColorChange = useCallback(
    (colorKey: keyof ColorValues, newValue: string) => {
      const trimmedValue = newValue.trim();

      // Update input field
      setInputValues((prev) => ({
        ...prev,
        [colorKey]: trimmedValue,
      }));

      // Validate color
      if (trimmedValue === '') {
        setInvalidColors((prev) => new Set(prev).add(colorKey));
        return;
      }

      if (!isValidColor(trimmedValue)) {
        setInvalidColors((prev) => new Set(prev).add(colorKey));
        return;
      }

      // Valid color - remove from invalid set
      setInvalidColors((prev) => {
        const next = new Set(prev);
        next.delete(colorKey);
        return next;
      });

      // Update parent state
      const parsed = parseColor(trimmedValue);
      if (parsed) {
        const updatedColors = {
          ...colors,
          [colorKey]: parsed.hex,
        };
        onChange(updatedColors);

        // Trigger preview update
        if (onPreviewUpdate) {
          onPreviewUpdate(updatedColors);
        }
      }
    },
    [colors, onChange, onPreviewUpdate]
  );

  // Format conversion functions
  const getColorFormats = useCallback(
    (colorHex: string): { hex: string; rgb: string; hsl: string } | null => {
      const parsed = parseColor(colorHex);
      if (!parsed) return null;

      return {
        hex: parsed.hex,
        rgb: rgbToString(parsed.rgb),
        hsl: hslToString(parsed.hsl),
      };
    },
    []
  );

  // Copy color to clipboard
  const handleCopyColor = useCallback(
    async (colorKey: string, format: 'hex' | 'rgb' | 'hsl') => {
      const colorValue = colors[colorKey as keyof ColorValues];
      const formats = getColorFormats(colorValue);

      if (!formats) return;

      const textToCopy = formats[format];
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedColor(`${colorKey}-${format}`);
        toast.success(`Copied ${format.toUpperCase()}: ${textToCopy}`);
        setTimeout(() => setCopiedColor(null), 2000);
      } catch (err) {
        toast.error('Failed to copy color');
      }
    },
    [colors, getColorFormats]
  );

  // Render color swatch with preview
  const ColorSwatch = ({ colorKey, colorValue }: { colorKey: string; colorValue: string }) => {
    const formats = getColorFormats(colorValue);
    const isExpanded = expandedColor === colorKey;

    return (
      <div key={colorKey} className="space-y-2">
        <div
          className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          onClick={() =>
            setExpandedColor(isExpanded ? null : (colorKey as keyof ColorValues))
          }
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-md border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: colorValue }}
              title={`Color: ${colorValue}`}
            />
            <div>
              <p className="font-medium text-gray-900">
                {COLOR_DEFINITIONS.find((c) => c.key === colorKey)?.label}
              </p>
              <p className="text-sm text-gray-500">
                {COLOR_DEFINITIONS.find((c) => c.key === colorKey)?.description}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono text-gray-600">{colorValue}</p>
            <p className="text-xs text-gray-400">Click to edit</p>
          </div>
        </div>

        {/* Expanded color editor */}
        {isExpanded && (
          <div className="ml-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            {/* Color input fields */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Hex Format</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="text"
                    placeholder="#000000"
                    value={inputValues[colorKey] || ''}
                    onChange={(e) => handleColorChange(colorKey as keyof ColorValues, e.target.value)}
                    className={`font-mono text-sm ${
                      invalidColors.has(colorKey)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopyColor(colorKey, 'hex')
                    }
                    className="w-10 px-0"
                  >
                    {copiedColor === `${colorKey}-hex` ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {formats && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">{formats.hex}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">RGB Format</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="text"
                    placeholder="rgb(0, 0, 0)"
                    value={formats?.rgb || ''}
                    readOnly
                    className="font-mono text-sm bg-gray-100 cursor-not-allowed"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyColor(colorKey, 'rgb')}
                    className="w-10 px-0"
                  >
                    {copiedColor === `${colorKey}-rgb` ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">HSL Format</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="text"
                    placeholder="hsl(0, 0%, 0%)"
                    value={formats?.hsl || ''}
                    readOnly
                    className="font-mono text-sm bg-gray-100 cursor-not-allowed"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyColor(colorKey, 'hsl')}
                    className="w-10 px-0"
                  >
                    {copiedColor === `${colorKey}-hsl` ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Error message */}
            {invalidColors.has(colorKey) && (
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>
                  Invalid color format. Use hex (#000), rgb(0,0,0), or hsl(0,0%,0%)
                </span>
              </div>
            )}

            {/* Color picker input */}
            <div>
              <Label className="text-sm font-medium">Color Picker</Label>
              <Input
                type="color"
                value={colors[colorKey as keyof ColorValues]}
                onChange={(e) =>
                  handleColorChange(
                    colorKey as keyof ColorValues,
                    e.target.value
                  )
                }
                className="h-10 mt-1 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Customization</CardTitle>
        <CardDescription>
          Customize your brand colors. Supports hex, RGB, and HSL formats.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {COLOR_DEFINITIONS.map((colorDef) => (
            <ColorSwatch
              key={colorDef.key}
              colorKey={colorDef.key}
              colorValue={colors[colorDef.key as keyof ColorValues]}
            />
          ))}
        </div>

        {/* Format Guide */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 text-sm mb-2">Supported Formats</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <span className="font-mono">Hex: #FF5733</span> or <span className="font-mono">#F57</span></li>
            <li>• <span className="font-mono">RGB: rgb(255, 87, 51)</span></li>
            <li>• <span className="font-mono">HSL: hsl(9, 100%, 60%)</span></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
