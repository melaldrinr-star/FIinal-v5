import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export interface ComponentSettings {
  navigation?: {
    enabled: boolean;
    style?: 'light' | 'dark';
  };
  hero?: {
    enabled: boolean;
    backgroundImage?: string;
    overlayColor?: string;
    height?: string;
  };
  features?: {
    enabled: boolean;
    layout?: 'grid' | 'list';
    columns?: number;
  };
  testimonials?: {
    enabled: boolean;
    displayCount?: number;
  };
  ctaSection?: {
    enabled: boolean;
    style?: 'button' | 'banner';
  };
  contact?: {
    enabled: boolean;
    formFields?: string[];
  };
  footer?: {
    enabled: boolean;
    linkColumns?: number;
  };
}

export interface ComponentTogglerProps {
  components: ComponentSettings;
  onChange: (components: ComponentSettings) => void;
  onPreviewUpdate?: (components: ComponentSettings) => void;
}

/**
 * ComponentToggler Component
 * Provides toggle switches for landing page components
 * Allows enabling/disabling and customizing individual components
 */
export default function ComponentToggler({
  components,
  onChange,
  onPreviewUpdate,
}: ComponentTogglerProps) {
  // Handle component enabled/disabled toggle
  const handleComponentToggle = useCallback(
    (componentName: keyof ComponentSettings, enabled: boolean) => {
      const updated = {
        ...components,
        [componentName]: {
          ...(components[componentName] || {}),
          enabled,
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [components, onChange, onPreviewUpdate]
  );

  // Handle component-specific option changes
  const handleComponentOptionChange = useCallback(
    (componentName: keyof ComponentSettings, optionKey: string, value: any) => {
      const updated = {
        ...components,
        [componentName]: {
          ...(components[componentName] || {}),
          [optionKey]: value,
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [components, onChange, onPreviewUpdate]
  );

  const navigationSettings = (components.navigation || {}) as any;
  const heroSettings = (components.hero || {}) as any;
  const featuresSettings = (components.features || {}) as any;
  const testimonialSettings = (components.testimonials || {}) as any;
  const ctaSettings = (components.ctaSection || {}) as any;
  const contactSettings = (components.contact || {}) as any;
  const footerSettings = (components.footer || {}) as any;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Visibility & Customization</CardTitle>
        <CardDescription>
          Enable or disable landing page components and customize their specific settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Navigation Component */}
        <div className="space-y-4 pb-6 border-b">
          <div className="flex items-center justify-between">
            <Label htmlFor="nav-toggle" className="text-base font-semibold">
              Navigation
            </Label>
            <Switch
              id="nav-toggle"
              checked={navigationSettings.enabled || false}
              onCheckedChange={(checked) => handleComponentToggle('navigation', checked)}
            />
          </div>

          {navigationSettings.enabled && (
            <div className="ml-4 space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <Label htmlFor="nav-style" className="mb-2 block text-sm">
                  Navigation Style
                </Label>
                <Select
                  value={navigationSettings.style || 'light'}
                  onValueChange={(value) =>
                    handleComponentOptionChange('navigation', 'style', value)
                  }
                >
                  <SelectTrigger id="nav-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Hero Section Component */}
        <div className="space-y-4 pb-6 border-b">
          <div className="flex items-center justify-between">
            <Label htmlFor="hero-toggle" className="text-base font-semibold">
              Hero Section
            </Label>
            <Switch
              id="hero-toggle"
              checked={heroSettings.enabled || false}
              onCheckedChange={(checked) => handleComponentToggle('hero', checked)}
            />
          </div>

          {heroSettings.enabled && (
            <div className="ml-4 space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <Label htmlFor="hero-bg-image" className="mb-2 block text-sm">
                  Background Image URL
                </Label>
                <Input
                  id="hero-bg-image"
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={heroSettings.backgroundImage || ''}
                  onChange={(e) =>
                    handleComponentOptionChange('hero', 'backgroundImage', e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="hero-overlay" className="mb-2 block text-sm">
                  Overlay Color (rgba)
                </Label>
                <Input
                  id="hero-overlay"
                  type="text"
                  placeholder="rgba(0, 0, 0, 0.3)"
                  value={heroSettings.overlayColor || ''}
                  onChange={(e) =>
                    handleComponentOptionChange('hero', 'overlayColor', e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="hero-height" className="mb-2 block text-sm">
                  Hero Height (e.g., 500px)
                </Label>
                <Input
                  id="hero-height"
                  type="text"
                  placeholder="500px"
                  value={heroSettings.height || ''}
                  onChange={(e) => handleComponentOptionChange('hero', 'height', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Features Section Component */}
        <div className="space-y-4 pb-6 border-b">
          <div className="flex items-center justify-between">
            <Label htmlFor="features-toggle" className="text-base font-semibold">
              Features Section
            </Label>
            <Switch
              id="features-toggle"
              checked={featuresSettings.enabled || false}
              onCheckedChange={(checked) => handleComponentToggle('features', checked)}
            />
          </div>

          {featuresSettings.enabled && (
            <div className="ml-4 space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <Label htmlFor="features-layout" className="mb-2 block text-sm">
                  Features Layout
                </Label>
                <Select
                  value={featuresSettings.layout || 'grid'}
                  onValueChange={(value) =>
                    handleComponentOptionChange('features', 'layout', value)
                  }
                >
                  <SelectTrigger id="features-layout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="features-columns" className="mb-2 block text-sm">
                  Columns (for grid layout)
                </Label>
                <Select
                  value={(featuresSettings.columns || 3).toString()}
                  onValueChange={(value) =>
                    handleComponentOptionChange('features', 'columns', parseInt(value))
                  }
                >
                  <SelectTrigger id="features-columns">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Columns</SelectItem>
                    <SelectItem value="3">3 Columns</SelectItem>
                    <SelectItem value="4">4 Columns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Testimonials Component */}
        <div className="space-y-4 pb-6 border-b">
          <div className="flex items-center justify-between">
            <Label htmlFor="testimonials-toggle" className="text-base font-semibold">
              Testimonials Section
            </Label>
            <Switch
              id="testimonials-toggle"
              checked={testimonialSettings.enabled || false}
              onCheckedChange={(checked) => handleComponentToggle('testimonials', checked)}
            />
          </div>

          {testimonialSettings.enabled && (
            <div className="ml-4 space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <Label htmlFor="testimonials-count" className="mb-2 block text-sm">
                  Number of Testimonials to Display
                </Label>
                <Select
                  value={(testimonialSettings.displayCount || 3).toString()}
                  onValueChange={(value) =>
                    handleComponentOptionChange('testimonials', 'displayCount', parseInt(value))
                  }
                >
                  <SelectTrigger id="testimonials-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section Component */}
        <div className="space-y-4 pb-6 border-b">
          <div className="flex items-center justify-between">
            <Label htmlFor="cta-toggle" className="text-base font-semibold">
              Call-to-Action (CTA) Section
            </Label>
            <Switch
              id="cta-toggle"
              checked={ctaSettings.enabled || false}
              onCheckedChange={(checked) => handleComponentToggle('ctaSection', checked)}
            />
          </div>

          {ctaSettings.enabled && (
            <div className="ml-4 space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <Label htmlFor="cta-style" className="mb-2 block text-sm">
                  CTA Style
                </Label>
                <Select
                  value={ctaSettings.style || 'button'}
                  onValueChange={(value) => handleComponentOptionChange('ctaSection', 'style', value)}
                >
                  <SelectTrigger id="cta-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="button">Button</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Contact Section Component */}
        <div className="space-y-4 pb-6 border-b">
          <div className="flex items-center justify-between">
            <Label htmlFor="contact-toggle" className="text-base font-semibold">
              Contact Section
            </Label>
            <Switch
              id="contact-toggle"
              checked={contactSettings.enabled || false}
              onCheckedChange={(checked) => handleComponentToggle('contact', checked)}
            />
          </div>

          {contactSettings.enabled && (
            <div className="ml-4 space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <Label className="mb-2 block text-sm">Form Fields</Label>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        (contactSettings.formFields || []).includes('email')
                      }
                      onChange={(e) => {
                        const fields = contactSettings.formFields || [];
                        const updated = e.target.checked
                          ? [...fields, 'email']
                          : fields.filter((f: string) => f !== 'email');
                        handleComponentOptionChange('contact', 'formFields', updated);
                      }}
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        (contactSettings.formFields || []).includes('phone')
                      }
                      onChange={(e) => {
                        const fields = contactSettings.formFields || [];
                        const updated = e.target.checked
                          ? [...fields, 'phone']
                          : fields.filter((f: string) => f !== 'phone');
                        handleComponentOptionChange('contact', 'formFields', updated);
                      }}
                    />
                    Phone
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        (contactSettings.formFields || []).includes('message')
                      }
                      onChange={(e) => {
                        const fields = contactSettings.formFields || [];
                        const updated = e.target.checked
                          ? [...fields, 'message']
                          : fields.filter((f: string) => f !== 'message');
                        handleComponentOptionChange('contact', 'formFields', updated);
                      }}
                    />
                    Message
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Component */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="footer-toggle" className="text-base font-semibold">
              Footer
            </Label>
            <Switch
              id="footer-toggle"
              checked={footerSettings.enabled || false}
              onCheckedChange={(checked) => handleComponentToggle('footer', checked)}
            />
          </div>

          {footerSettings.enabled && (
            <div className="ml-4 space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <Label htmlFor="footer-columns" className="mb-2 block text-sm">
                  Footer Link Columns
                </Label>
                <Select
                  value={(footerSettings.linkColumns || 4).toString()}
                  onValueChange={(value) =>
                    handleComponentOptionChange('footer', 'linkColumns', parseInt(value))
                  }
                >
                  <SelectTrigger id="footer-columns">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Columns</SelectItem>
                    <SelectItem value="3">3 Columns</SelectItem>
                    <SelectItem value="4">4 Columns</SelectItem>
                    <SelectItem value="5">5 Columns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
