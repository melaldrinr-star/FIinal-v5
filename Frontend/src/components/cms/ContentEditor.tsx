import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface Testimonial {
  id: string;
  text: string;
  author: string;
  image?: string;
}

export interface ContentValues {
  hero: {
    heading: string;
    subheading: string;
    ctaText: string;
  };
  missionVision: {
    title: string;
    description: string;
    vision: string;
  };
  features: Feature[];
  testimonials: Testimonial[];
  contact: {
    email: string;
    phone: string;
    address: string;
    socialLinks: {
      twitter?: string;
      linkedin?: string;
      facebook?: string;
      instagram?: string;
    };
  };
}

export interface ContentEditorProps {
  content: ContentValues;
  onChange: (content: ContentValues) => void;
  onPreviewUpdate?: (content: ContentValues) => void;
}

const CHARACTER_LIMITS = {
  heading: 100,
  subheading: 150,
  ctaText: 50,
  missionTitle: 100,
  missionDescription: 500,
  vision: 500,
  featureTitle: 80,
  featureDescription: 250,
  testimonialText: 300,
  testimonialAuthor: 50,
  email: 100,
  phone: 20,
  address: 200,
  socialUrl: 300,
};

/**
 * ContentEditor Component
 * Provides content customization for landing page sections
 * Supports hero, mission/vision, features, testimonials, and contact info
 */
export default function ContentEditor({
  content,
  onChange,
  onPreviewUpdate,
}: ContentEditorProps) {
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);

  // Validate character limit
  const validateCharLimit = useCallback(
    (value: string, limit: number): boolean => {
      return value.length <= limit;
    },
    []
  );

  // Validate email format
  const validateEmail = useCallback((email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  // Validate URL format
  const validateUrl = useCallback((url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Handle hero content change
  const handleHeroChange = useCallback(
    (field: keyof typeof content.hero, value: string) => {
      const limit = CHARACTER_LIMITS[field as keyof typeof CHARACTER_LIMITS] || 100;

      if (!validateCharLimit(value, limit)) {
        setErrors((prev) => new Set(prev).add(`hero_${field}`));
        toast.error(`${field} exceeds ${limit} character limit`);
        return;
      }

      setErrors((prev) => {
        const next = new Set(prev);
        next.delete(`hero_${field}`);
        return next;
      });

      const updated = {
        ...content,
        hero: {
          ...content.hero,
          [field]: value,
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [content, onChange, onPreviewUpdate, validateCharLimit]
  );

  // Handle mission/vision change
  const handleMissionVisionChange = useCallback(
    (field: keyof typeof content.missionVision, value: string) => {
      const limitKey =
        field === 'title' ? 'missionTitle' : field === 'description' ? 'missionDescription' : 'vision';
      const limit = CHARACTER_LIMITS[limitKey as keyof typeof CHARACTER_LIMITS];

      if (!validateCharLimit(value, limit)) {
        setErrors((prev) => new Set(prev).add(`mission_${field}`));
        toast.error(`${field} exceeds ${limit} character limit`);
        return;
      }

      setErrors((prev) => {
        const next = new Set(prev);
        next.delete(`mission_${field}`);
        return next;
      });

      const updated = {
        ...content,
        missionVision: {
          ...content.missionVision,
          [field]: value,
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [content, onChange, onPreviewUpdate, validateCharLimit]
  );

  // Add new feature
  const addFeature = useCallback(() => {
    const newFeature: Feature = {
      id: Date.now().toString(),
      title: '',
      description: '',
      icon: '',
    };

    const updated = {
      ...content,
      features: [...content.features, newFeature],
    };
    onChange(updated);
    if (onPreviewUpdate) onPreviewUpdate(updated);
  }, [content, onChange, onPreviewUpdate]);

  // Update feature
  const updateFeature = useCallback(
    (id: string, field: keyof Feature, value: string) => {
      const limitKey =
        field === 'title' ? 'featureTitle' : field === 'description' ? 'featureDescription' : 'featureTitle';
      const limit = CHARACTER_LIMITS[limitKey as keyof typeof CHARACTER_LIMITS];

      if (field !== 'icon' && !validateCharLimit(value, limit)) {
        toast.error(`Feature ${field} exceeds ${limit} character limit`);
        return;
      }

      const updated = {
        ...content,
        features: content.features.map((f) =>
          f.id === id ? { ...f, [field]: value } : f
        ),
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [content, onChange, onPreviewUpdate, validateCharLimit]
  );

  // Delete feature
  const deleteFeature = useCallback(
    (id: string) => {
      const updated = {
        ...content,
        features: content.features.filter((f) => f.id !== id),
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [content, onChange, onPreviewUpdate]
  );

  // Add new testimonial
  const addTestimonial = useCallback(() => {
    const newTestimonial: Testimonial = {
      id: Date.now().toString(),
      text: '',
      author: '',
      image: '',
    };

    const updated = {
      ...content,
      testimonials: [...content.testimonials, newTestimonial],
    };
    onChange(updated);
    if (onPreviewUpdate) onPreviewUpdate(updated);
  }, [content, onChange, onPreviewUpdate]);

  // Update testimonial
  const updateTestimonial = useCallback(
    (id: string, field: keyof Testimonial, value: string) => {
      const limitKey =
        field === 'text' ? 'testimonialText' : field === 'author' ? 'testimonialAuthor' : 'testimonialText';
      const limit = CHARACTER_LIMITS[limitKey as keyof typeof CHARACTER_LIMITS];

      if (field !== 'image' && !validateCharLimit(value, limit)) {
        toast.error(`Testimonial ${field} exceeds ${limit} character limit`);
        return;
      }

      const updated = {
        ...content,
        testimonials: content.testimonials.map((t) =>
          t.id === id ? { ...t, [field]: value } : t
        ),
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [content, onChange, onPreviewUpdate, validateCharLimit]
  );

  // Delete testimonial
  const deleteTestimonial = useCallback(
    (id: string) => {
      const updated = {
        ...content,
        testimonials: content.testimonials.filter((t) => t.id !== id),
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [content, onChange, onPreviewUpdate]
  );

  // Handle contact info change
  const handleContactChange = useCallback(
    (field: keyof typeof content.contact, value: string) => {
      if (field === 'email') {
        if (value && !validateEmail(value)) {
          toast.error('Please enter a valid email address');
          setErrors((prev) => new Set(prev).add('contact_email'));
          return;
        }
      }

      const limit = CHARACTER_LIMITS[field as keyof typeof CHARACTER_LIMITS] || 100;
      if (!validateCharLimit(value, limit)) {
        toast.error(`${field} exceeds ${limit} character limit`);
        return;
      }

      setErrors((prev) => {
        const next = new Set(prev);
        next.delete(`contact_${field}`);
        return next;
      });

      const updated = {
        ...content,
        contact: {
          ...content.contact,
          [field]: value,
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [content, onChange, onPreviewUpdate, validateCharLimit, validateEmail]
  );

  // Handle social link change
  const handleSocialLinkChange = useCallback(
    (platform: keyof typeof content.contact.socialLinks, value: string) => {
      if (value && !validateUrl(value)) {
        toast.error(`Please enter a valid URL for ${platform}`);
        return;
      }

      const limit = CHARACTER_LIMITS.socialUrl;
      if (!validateCharLimit(value, limit)) {
        toast.error(`${platform} URL exceeds ${limit} character limit`);
        return;
      }

      const updated = {
        ...content,
        contact: {
          ...content.contact,
          socialLinks: {
            ...content.contact.socialLinks,
            [platform]: value,
          },
        },
      };
      onChange(updated);
      if (onPreviewUpdate) onPreviewUpdate(updated);
    },
    [content, onChange, onPreviewUpdate, validateCharLimit, validateUrl]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Customization</CardTitle>
        <CardDescription>
          Customize all text content for your landing page sections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Hero Section */}
        <div className="space-y-4 pb-6 border-b">
          <h3 className="text-lg font-semibold">Hero Section</h3>

          <div>
            <Label htmlFor="hero-heading" className="mb-2 block">
              Heading ({content.hero.heading.length}/{CHARACTER_LIMITS.heading})
            </Label>
            <Input
              id="hero-heading"
              type="text"
              maxLength={CHARACTER_LIMITS.heading}
              value={content.hero.heading}
              onChange={(e) => handleHeroChange('heading', e.target.value)}
              className={errors.has('hero_heading') ? 'border-red-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="hero-subheading" className="mb-2 block">
              Subheading ({content.hero.subheading.length}/{CHARACTER_LIMITS.subheading})
            </Label>
            <Textarea
              id="hero-subheading"
              maxLength={CHARACTER_LIMITS.subheading}
              rows={2}
              value={content.hero.subheading}
              onChange={(e) => handleHeroChange('subheading', e.target.value)}
              className={errors.has('hero_subheading') ? 'border-red-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="hero-cta" className="mb-2 block">
              CTA Button Text ({content.hero.ctaText.length}/{CHARACTER_LIMITS.ctaText})
            </Label>
            <Input
              id="hero-cta"
              type="text"
              maxLength={CHARACTER_LIMITS.ctaText}
              value={content.hero.ctaText}
              onChange={(e) => handleHeroChange('ctaText', e.target.value)}
              className={errors.has('hero_ctaText') ? 'border-red-500' : ''}
            />
          </div>
        </div>

        {/* Mission/Vision Section */}
        <div className="space-y-4 pb-6 border-b">
          <h3 className="text-lg font-semibold">Mission & Vision</h3>

          <div>
            <Label htmlFor="mission-title" className="mb-2 block">
              Title ({content.missionVision.title.length}/{CHARACTER_LIMITS.missionTitle})
            </Label>
            <Input
              id="mission-title"
              type="text"
              maxLength={CHARACTER_LIMITS.missionTitle}
              value={content.missionVision.title}
              onChange={(e) => handleMissionVisionChange('title', e.target.value)}
              className={errors.has('mission_title') ? 'border-red-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="mission-description" className="mb-2 block">
              Description ({content.missionVision.description.length}/{CHARACTER_LIMITS.missionDescription})
            </Label>
            <Textarea
              id="mission-description"
              maxLength={CHARACTER_LIMITS.missionDescription}
              rows={3}
              value={content.missionVision.description}
              onChange={(e) => handleMissionVisionChange('description', e.target.value)}
              className={errors.has('mission_description') ? 'border-red-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="mission-vision" className="mb-2 block">
              Vision ({content.missionVision.vision.length}/{CHARACTER_LIMITS.vision})
            </Label>
            <Textarea
              id="mission-vision"
              maxLength={CHARACTER_LIMITS.vision}
              rows={3}
              value={content.missionVision.vision}
              onChange={(e) => handleMissionVisionChange('vision', e.target.value)}
              className={errors.has('mission_vision') ? 'border-red-500' : ''}
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-4 pb-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Features</h3>
            <Button
              size="sm"
              onClick={addFeature}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Feature
            </Button>
          </div>

          {content.features.length === 0 ? (
            <p className="text-sm text-gray-500">No features added yet</p>
          ) : (
            <div className="space-y-4">
              {content.features.map((feature) => (
                <div key={feature.id} className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-3">
                  <div>
                    <Label className="mb-2 block text-sm">
                      Title ({feature.title.length}/{CHARACTER_LIMITS.featureTitle})
                    </Label>
                    <Input
                      type="text"
                      maxLength={CHARACTER_LIMITS.featureTitle}
                      value={feature.title}
                      onChange={(e) => updateFeature(feature.id, 'title', e.target.value)}
                      placeholder="Feature title"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm">
                      Description ({feature.description.length}/{CHARACTER_LIMITS.featureDescription})
                    </Label>
                    <Textarea
                      maxLength={CHARACTER_LIMITS.featureDescription}
                      rows={2}
                      value={feature.description}
                      onChange={(e) => updateFeature(feature.id, 'description', e.target.value)}
                      placeholder="Feature description"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm">Icon Name (optional)</Label>
                    <Input
                      type="text"
                      value={feature.icon || ''}
                      onChange={(e) => updateFeature(feature.id, 'icon', e.target.value)}
                      placeholder="e.g., star, heart, check"
                    />
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteFeature(feature.id)}
                    className="gap-2 w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Feature
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Testimonials Section */}
        <div className="space-y-4 pb-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Testimonials</h3>
            <Button
              size="sm"
              onClick={addTestimonial}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Testimonial
            </Button>
          </div>

          {content.testimonials.length === 0 ? (
            <p className="text-sm text-gray-500">No testimonials added yet</p>
          ) : (
            <div className="space-y-4">
              {content.testimonials.map((testimonial) => (
                <div key={testimonial.id} className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-3">
                  <div>
                    <Label className="mb-2 block text-sm">
                      Testimonial Text ({testimonial.text.length}/{CHARACTER_LIMITS.testimonialText})
                    </Label>
                    <Textarea
                      maxLength={CHARACTER_LIMITS.testimonialText}
                      rows={2}
                      value={testimonial.text}
                      onChange={(e) => updateTestimonial(testimonial.id, 'text', e.target.value)}
                      placeholder="What did the customer say?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-2 block text-sm">
                        Author ({testimonial.author.length}/{CHARACTER_LIMITS.testimonialAuthor})
                      </Label>
                      <Input
                        type="text"
                        maxLength={CHARACTER_LIMITS.testimonialAuthor}
                        value={testimonial.author}
                        onChange={(e) => updateTestimonial(testimonial.id, 'author', e.target.value)}
                        placeholder="Customer name"
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block text-sm">Author Image URL (optional)</Label>
                      <Input
                        type="text"
                        value={testimonial.image || ''}
                        onChange={(e) => updateTestimonial(testimonial.id, 'image', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteTestimonial(testimonial.id)}
                    className="gap-2 w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Testimonial
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contact Information</h3>

          <div>
            <Label htmlFor="contact-email" className="mb-2 block">
              Email ({content.contact.email.length}/{CHARACTER_LIMITS.email})
            </Label>
            <Input
              id="contact-email"
              type="email"
              maxLength={CHARACTER_LIMITS.email}
              value={content.contact.email}
              onChange={(e) => handleContactChange('email', e.target.value)}
              className={errors.has('contact_email') ? 'border-red-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="contact-phone" className="mb-2 block">
              Phone ({content.contact.phone.length}/{CHARACTER_LIMITS.phone})
            </Label>
            <Input
              id="contact-phone"
              type="tel"
              maxLength={CHARACTER_LIMITS.phone}
              value={content.contact.phone}
              onChange={(e) => handleContactChange('phone', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="contact-address" className="mb-2 block">
              Address ({content.contact.address.length}/{CHARACTER_LIMITS.address})
            </Label>
            <Textarea
              id="contact-address"
              maxLength={CHARACTER_LIMITS.address}
              rows={2}
              value={content.contact.address}
              onChange={(e) => handleContactChange('address', e.target.value)}
            />
          </div>

          {/* Social Links */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
            <Label className="block font-semibold">Social Media Links</Label>

            <div>
              <Label className="mb-2 block text-sm">Twitter</Label>
              <Input
                type="text"
                value={content.contact.socialLinks.twitter || ''}
                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                placeholder="https://twitter.com/..."
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm">LinkedIn</Label>
              <Input
                type="text"
                value={content.contact.socialLinks.linkedin || ''}
                onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/..."
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm">Facebook</Label>
              <Input
                type="text"
                value={content.contact.socialLinks.facebook || ''}
                onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm">Instagram</Label>
              <Input
                type="text"
                value={content.contact.socialLinks.instagram || ''}
                onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
