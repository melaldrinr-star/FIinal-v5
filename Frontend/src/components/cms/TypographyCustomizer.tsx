import { useState, useCallback, useMemo } from 'react';
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
import { AlertCircle, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export interface TypographyValues {
  headings: {
    fontFamily: string;
    fontSize: {
      h1: number;
      h2: number;
      h3: number;
    };
    fontWeight: number;
    lineHeight: number;
  };
  body: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
  };
}

export interface TypographyCustomizerProps {
  typography: TypographyValues;
  onChange: (typography: TypographyValues) => void;
  onPreviewUpdate?: (typography: TypographyValues) => void;
}

const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter (default)' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Ubuntu', label: 'Ubuntu' },
];

const FONT_WEIGHTS = [
  { value: 100, label: '100 - Thin' },
  { value: 200, label: '200 - Extra Light' },
  { value: 300, label: '300 - Light' },
  { value: 400, label: '400 - Regular' },
  { value: 500, label: '500 - Medium' },
  { value: 600, label: '600 - Semibold' },
  { value: 700, label: '700 - Bold' },
  { value: 800, label: '800 - Extra Bold' },
  { value: 900, label: '900 - Black' },
];

const HEADING_SIZES = { h1: 'H1', h2: 'H2', h3: 'H3' };

/**
 * TypographyCustomizer Component
 * Provides typography customization with font family, size, weight, and line height
 * Displays live preview of typography changes
 */
export default function TypographyCustomizer({
  typography,
  onChange,
  onPreviewUpdate,
}: TypographyCustomizerProps) {
  const [errors, setErrors] = useState<Set<string>>(new Set());

  // Validate numeric input
  const validateNumericInput = useCallback((value: string, min = 1, max = 1000): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  }, []);

  // Validate font size input
  const validateFontSize = useCallback((value: string): boolean => {
    return validateNumericInput(value, 8, 200);
  }, [validateNumericInput]);

  // Validate line height input
  const validateLineHeight = useCallback((value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0.5 && num <= 4;
  }, []);

  // Handle heading font family change
  const handleHeadingFontFamilyChange = useCallback(
    (newFamily: string) => {
      const updated = {
        ...typography,
        headings: {
          ...typography.headings,
          fontFamily: newFamily,
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [typography, onChange, onPreviewUpdate]
  );

  // Handle body font family change
  const handleBodyFontFamilyChange = useCallback(
    (newFamily: string) => {
      const updated = {
        ...typography,
        body: {
          ...typography.body,
          fontFamily: newFamily,
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [typography, onChange, onPreviewUpdate]
  );

  // Handle heading font size change
  const handleHeadingFontSizeChange = useCallback(
    (heading: keyof typeof HEADING_SIZES, value: string) => {
      if (value === '') {
        setErrors((prev) => new Set(prev).add(`h_${heading}`));
        return;
      }

      if (!validateFontSize(value)) {
        setErrors((prev) => new Set(prev).add(`h_${heading}`));
        toast.error(`Font size must be between 8 and 200px for ${heading.toUpperCase()}`);
        return;
      }

      setErrors((prev) => {
        const next = new Set(prev);
        next.delete(`h_${heading}`);
        return next;
      });

      const updated = {
        ...typography,
        headings: {
          ...typography.headings,
          fontSize: {
            ...typography.headings.fontSize,
            [heading]: parseInt(value),
          },
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [typography, onChange, onPreviewUpdate, validateFontSize]
  );

  // Handle body font size change
  const handleBodyFontSizeChange = useCallback(
    (value: string) => {
      if (value === '') {
        setErrors((prev) => new Set(prev).add('body_size'));
        return;
      }

      if (!validateFontSize(value)) {
        setErrors((prev) => new Set(prev).add('body_size'));
        toast.error('Font size must be between 8 and 200px');
        return;
      }

      setErrors((prev) => {
        const next = new Set(prev);
        next.delete('body_size');
        return next;
      });

      const updated = {
        ...typography,
        body: {
          ...typography.body,
          fontSize: parseInt(value),
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [typography, onChange, onPreviewUpdate, validateFontSize]
  );

  // Handle heading font weight change
  const handleHeadingFontWeightChange = useCallback(
    (value: string) => {
      const weight = parseInt(value);
      const updated = {
        ...typography,
        headings: {
          ...typography.headings,
          fontWeight: weight,
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [typography, onChange, onPreviewUpdate]
  );

  // Handle body font weight change
  const handleBodyFontWeightChange = useCallback(
    (value: string) => {
      const weight = parseInt(value);
      const updated = {
        ...typography,
        body: {
          ...typography.body,
          fontWeight: weight,
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [typography, onChange, onPreviewUpdate]
  );

  // Handle heading line height change
  const handleHeadingLineHeightChange = useCallback(
    (value: string) => {
      if (value === '') {
        setErrors((prev) => new Set(prev).add('h_lineHeight'));
        return;
      }

      if (!validateLineHeight(value)) {
        setErrors((prev) => new Set(prev).add('h_lineHeight'));
        toast.error('Line height must be between 0.5 and 4');
        return;
      }

      setErrors((prev) => {
        const next = new Set(prev);
        next.delete('h_lineHeight');
        return next;
      });

      const updated = {
        ...typography,
        headings: {
          ...typography.headings,
          lineHeight: parseFloat(value),
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [typography, onChange, onPreviewUpdate, validateLineHeight]
  );

  // Handle body line height change
  const handleBodyLineHeightChange = useCallback(
    (value: string) => {
      if (value === '') {
        setErrors((prev) => new Set(prev).add('body_lineHeight'));
        return;
      }

      if (!validateLineHeight(value)) {
        setErrors((prev) => new Set(prev).add('body_lineHeight'));
        toast.error('Line height must be between 0.5 and 4');
        return;
      }

      setErrors((prev) => {
        const next = new Set(prev);
        next.delete('body_lineHeight');
        return next;
      });

      const updated = {
        ...typography,
        body: {
          ...typography.body,
          lineHeight: parseFloat(value),
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [typography, onChange, onPreviewUpdate, validateLineHeight]
  );

  // Create preview style
  const previewStyle = useMemo(() => {
    return {
      h1: {
        fontFamily: typography.headings.fontFamily,
        fontSize: `${typography.headings.fontSize.h1}px`,
        fontWeight: typography.headings.fontWeight,
        lineHeight: typography.headings.lineHeight,
        margin: 0,
        padding: '10px 0',
      },
      h2: {
        fontFamily: typography.headings.fontFamily,
        fontSize: `${typography.headings.fontSize.h2}px`,
        fontWeight: typography.headings.fontWeight,
        lineHeight: typography.headings.lineHeight,
        margin: 0,
        padding: '10px 0',
      },
      body: {
        fontFamily: typography.body.fontFamily,
        fontSize: `${typography.body.fontSize}px`,
        fontWeight: typography.body.fontWeight,
        lineHeight: typography.body.lineHeight,
        margin: 0,
        padding: '10px 0',
      },
    };
  }, [typography]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Typography Customization</CardTitle>
        <CardDescription>
          Customize fonts, sizes, weights, and line heights for your landing page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Headings Section */}
        <div className="space-y-4 pb-6 border-b">
          <div>
            <h3 className="text-lg font-semibold mb-4">Headings</h3>

            {/* Heading Font Family */}
            <div className="mb-4">
              <Label htmlFor="heading-font-family" className="mb-2 block">
                Font Family
              </Label>
              <Select value={typography.headings.fontFamily} onValueChange={handleHeadingFontFamilyChange}>
                <SelectTrigger id="heading-font-family">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Heading Font Sizes */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {Object.entries(HEADING_SIZES).map(([key, label]) => (
                <div key={key}>
                  <Label htmlFor={`h-size-${key}`} className="mb-2 block text-sm">
                    {label} Size (px)
                  </Label>
                  <Input
                    id={`h-size-${key}`}
                    type="number"
                    min="8"
                    max="200"
                    value={typography.headings.fontSize[key as keyof typeof HEADING_SIZES]}
                    onChange={(e) =>
                      handleHeadingFontSizeChange(
                        key as keyof typeof HEADING_SIZES,
                        e.target.value
                      )
                    }
                    className={errors.has(`h_${key}`) ? 'border-red-500' : ''}
                  />
                  {errors.has(`h_${key}`) && (
                    <p className="text-red-500 text-xs mt-1">Invalid font size</p>
                  )}
                </div>
              ))}
            </div>

            {/* Heading Font Weight */}
            <div className="mb-4">
              <Label htmlFor="heading-font-weight" className="mb-2 block">
                Font Weight
              </Label>
              <Select
                value={typography.headings.fontWeight.toString()}
                onValueChange={handleHeadingFontWeightChange}
              >
                <SelectTrigger id="heading-font-weight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHTS.map((weight) => (
                    <SelectItem key={weight.value} value={weight.value.toString()}>
                      {weight.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Heading Line Height */}
            <div className="mb-4">
              <Label htmlFor="heading-line-height" className="mb-2 block">
                Line Height (multiplier)
              </Label>
              <Input
                id="heading-line-height"
                type="number"
                min="0.5"
                max="4"
                step="0.1"
                value={typography.headings.lineHeight}
                onChange={(e) => handleHeadingLineHeightChange(e.target.value)}
                className={errors.has('h_lineHeight') ? 'border-red-500' : ''}
              />
              {errors.has('h_lineHeight') && (
                <p className="text-red-500 text-xs mt-1">Line height must be between 0.5 and 4</p>
              )}
            </div>

            {/* Heading Preview */}
            <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-xs text-gray-600 mb-3">Preview:</p>
              <h1 style={previewStyle.h1 as React.CSSProperties}>The Quick Brown Fox</h1>
              <h2 style={previewStyle.h2 as React.CSSProperties}>The Quick Brown Fox</h2>
              <h3 style={previewStyle.h1 as React.CSSProperties}>The Quick Brown Fox</h3>
            </div>
          </div>
        </div>

        {/* Body Text Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Body Text</h3>

            {/* Body Font Family */}
            <div className="mb-4">
              <Label htmlFor="body-font-family" className="mb-2 block">
                Font Family
              </Label>
              <Select value={typography.body.fontFamily} onValueChange={handleBodyFontFamilyChange}>
                <SelectTrigger id="body-font-family">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Body Font Size */}
            <div className="mb-4">
              <Label htmlFor="body-font-size" className="mb-2 block">
                Font Size (px)
              </Label>
              <Input
                id="body-font-size"
                type="number"
                min="8"
                max="200"
                value={typography.body.fontSize}
                onChange={(e) => handleBodyFontSizeChange(e.target.value)}
                className={errors.has('body_size') ? 'border-red-500' : ''}
              />
              {errors.has('body_size') && (
                <p className="text-red-500 text-xs mt-1">Font size must be between 8 and 200px</p>
              )}
            </div>

            {/* Body Font Weight */}
            <div className="mb-4">
              <Label htmlFor="body-font-weight" className="mb-2 block">
                Font Weight
              </Label>
              <Select
                value={typography.body.fontWeight.toString()}
                onValueChange={handleBodyFontWeightChange}
              >
                <SelectTrigger id="body-font-weight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHTS.map((weight) => (
                    <SelectItem key={weight.value} value={weight.value.toString()}>
                      {weight.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Body Line Height */}
            <div className="mb-4">
              <Label htmlFor="body-line-height" className="mb-2 block">
                Line Height (multiplier)
              </Label>
              <Input
                id="body-line-height"
                type="number"
                min="0.5"
                max="4"
                step="0.1"
                value={typography.body.lineHeight}
                onChange={(e) => handleBodyLineHeightChange(e.target.value)}
                className={errors.has('body_lineHeight') ? 'border-red-500' : ''}
              />
              {errors.has('body_lineHeight') && (
                <p className="text-red-500 text-xs mt-1">Line height must be between 0.5 and 4</p>
              )}
            </div>

            {/* Body Preview */}
            <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-xs text-gray-600 mb-3">Preview:</p>
              <p style={previewStyle.body as React.CSSProperties}>
                This is a sample of your body text. It shows how your paragraphs and regular content
                will look on the landing page with your selected font, size, and line height settings.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
