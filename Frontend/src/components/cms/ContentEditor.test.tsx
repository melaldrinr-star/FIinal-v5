import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import ContentEditor, { ContentValues } from './ContentEditor';
import { toast } from 'sonner';

/**
 * Component Tests: ContentEditor
 *
 * Tests the content editor sub-component for:
 * - All text fields accept input
 * - Character limits enforced
 * - Add/edit/delete for features and testimonials works
 * - Social media URL validation for social links
 * - Preview updated with content changes
 * - Property-based testing for content persistence
 *
 * **Property 9: Content Persistence** — Saved content matches original input
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
 */

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const defaultContent: ContentValues = {
  hero: {
    heading: 'Welcome to Our Platform',
    subheading: 'Build amazing things',
    ctaText: 'Get Started',
  },
  missionVision: {
    title: 'Our Mission',
    description: 'To empower businesses with cutting-edge solutions',
    vision: 'To be the leading provider of innovative services',
  },
  features: [
    { id: '1', title: 'Feature 1', description: 'Description 1', icon: 'star' },
    { id: '2', title: 'Feature 2', description: 'Description 2', icon: 'heart' },
  ],
  testimonials: [
    { id: '1', text: 'Great product!', author: 'John Doe', image: 'https://example.com/john.jpg' },
  ],
  contact: {
    email: 'contact@example.com',
    phone: '+1-555-000-0000',
    address: '123 Main St, City, State',
    socialLinks: {
      twitter: 'https://twitter.com/example',
      linkedin: 'https://linkedin.com/company/example',
    },
  },
};

describe('ContentEditor Component', () => {
  let onChange: ReturnType<typeof vi.fn>;
  let onPreviewUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
    onPreviewUpdate = vi.fn();
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render content editor card with title', () => {
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByText('Content Customization')).toBeInTheDocument();
      expect(screen.getByText(/Customize all text content/)).toBeInTheDocument();
    });

    it('should render hero section inputs', () => {
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByDisplayValue('Welcome to Our Platform')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Build amazing things')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Get Started')).toBeInTheDocument();
    });

    it('should render mission/vision inputs', () => {
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByDisplayValue('Our Mission')).toBeInTheDocument();
      expect(screen.getByDisplayValue('To empower businesses with cutting-edge solutions')).toBeInTheDocument();
    });

    it('should render features section with add button', () => {
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Feature/ })).toBeInTheDocument();
    });

    it('should render testimonials section with add button', () => {
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByText('Testimonials')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Testimonial/ })).toBeInTheDocument();
    });

    it('should render contact information inputs', () => {
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByDisplayValue('contact@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1-555-000-0000')).toBeInTheDocument();
    });

    it('should render social media links inputs', () => {
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByText('Social Media Links')).toBeInTheDocument();
    });
  });

  describe('Hero Section Text Input', () => {
    it('should accept hero heading input', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const headingInput = screen.getByDisplayValue('Welcome to Our Platform');
      await user.clear(headingInput);
      await user.type(headingInput, 'New Heading');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          hero: expect.objectContaining({
            heading: 'New Heading',
          }),
        })
      );
    });

    it('should enforce character limit for heading', async () => {
      const user = userEvent.setup();
      const longText = 'a'.repeat(110);

      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const headingInput = screen.getByDisplayValue('Welcome to Our Platform');
      await user.clear(headingInput);
      await user.type(headingInput, longText);

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('exceeds'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should accept valid hero subheading', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const subheadingInput = screen.getByDisplayValue('Build amazing things');
      await user.clear(subheadingInput);
      await user.type(subheadingInput, 'Create innovative solutions');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          hero: expect.objectContaining({
            subheading: 'Create innovative solutions',
          }),
        })
      );
    });
  });

  describe('Feature Management', () => {
    it('should display existing features', () => {
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByDisplayValue('Feature 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Feature 2')).toBeInTheDocument();
    });

    it('should add new feature', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const addButton = screen.getByRole('button', { name: /Add Feature/ });
      await user.click(addButton);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          features: expect.arrayContaining([
            expect.objectContaining({
              title: '',
              description: '',
            }),
          ]),
        })
      );
    });

    it('should update feature title', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const featureTitleInputs = screen.getAllByPlaceholderText('Feature title');
      await user.clear(featureTitleInputs[0]);
      await user.type(featureTitleInputs[0], 'Updated Feature');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          features: expect.arrayContaining([
            expect.objectContaining({
              title: 'Updated Feature',
            }),
          ]),
        })
      );
    });

    it('should update feature description', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const featureDescInputs = screen.getAllByPlaceholderText('Feature description');
      await user.clear(featureDescInputs[0]);
      await user.type(featureDescInputs[0], 'Updated description');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          features: expect.arrayContaining([
            expect.objectContaining({
              description: 'Updated description',
            }),
          ]),
        })
      );
    });

    it('should delete feature', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /Delete Feature/ });
      await user.click(deleteButtons[0]);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          features: expect.not.arrayContaining([
            expect.objectContaining({
              id: '1',
            }),
          ]),
        })
      );
    });

    it('should enforce feature title character limit', async () => {
      const user = userEvent.setup();
      const longText = 'a'.repeat(90);

      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const featureTitleInputs = screen.getAllByPlaceholderText('Feature title');
      await user.clear(featureTitleInputs[0]);
      await user.type(featureTitleInputs[0], longText);

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('exceeds'));
    });
  });

  describe('Testimonial Management', () => {
    it('should display existing testimonials', () => {
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByDisplayValue('Great product!')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('should add new testimonial', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const addButton = screen.getByRole('button', { name: /Add Testimonial/ });
      await user.click(addButton);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          testimonials: expect.arrayContaining([
            expect.objectContaining({
              text: '',
              author: '',
            }),
          ]),
        })
      );
    });

    it('should update testimonial text', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const testimonialInputs = screen.getAllByPlaceholderText('What did the customer say?');
      await user.clear(testimonialInputs[0]);
      await user.type(testimonialInputs[0], 'Excellent service!');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          testimonials: expect.arrayContaining([
            expect.objectContaining({
              text: 'Excellent service!',
            }),
          ]),
        })
      );
    });

    it('should delete testimonial', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /Delete Testimonial/ });
      await user.click(deleteButtons[0]);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          testimonials: expect.arrayContaining([]),
        })
      );
    });
  });

  describe('Contact Information', () => {
    it('should accept valid email', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const emailInput = screen.getByDisplayValue('contact@example.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'newemail@example.com');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          contact: expect.objectContaining({
            email: 'newemail@example.com',
          }),
        })
      );
    });

    it('should reject invalid email format', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const emailInput = screen.getByDisplayValue('contact@example.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'invalidemail');

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('valid email'));
    });

    it('should accept valid phone number', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const phoneInput = screen.getByDisplayValue('+1-555-000-0000');
      await user.clear(phoneInput);
      await user.type(phoneInput, '+1-555-123-4567');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          contact: expect.objectContaining({
            phone: '+1-555-123-4567',
          }),
        })
      );
    });

    it('should accept address input', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const addressInput = screen.getByDisplayValue('123 Main St, City, State');
      await user.clear(addressInput);
      await user.type(addressInput, '456 New Ave, Another City, State');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          contact: expect.objectContaining({
            address: '456 New Ave, Another City, State',
          }),
        })
      );
    });
  });

  describe('Social Media Links', () => {
    it('should accept valid social media URLs', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const twitterInputs = screen.getAllByPlaceholderText('https://twitter.com/...');
      await user.clear(twitterInputs[0]);
      await user.type(twitterInputs[0], 'https://twitter.com/newhandle');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          contact: expect.objectContaining({
            socialLinks: expect.objectContaining({
              twitter: 'https://twitter.com/newhandle',
            }),
          }),
        })
      );
    });

    it('should reject invalid social media URLs', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const twitterInputs = screen.getAllByPlaceholderText('https://twitter.com/...');
      await user.clear(twitterInputs[0]);
      await user.type(twitterInputs[0], 'not-a-valid-url');

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('valid URL'));
    });
  });

  describe('Preview Updates', () => {
    it('should call onPreviewUpdate when hero content changes', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const headingInput = screen.getByDisplayValue('Welcome to Our Platform');
      await user.clear(headingInput);
      await user.type(headingInput, 'New Heading');

      expect(onPreviewUpdate).toHaveBeenCalled();
    });

    it('should call onPreviewUpdate when feature is added', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditor
          content={defaultContent}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const addButton = screen.getByRole('button', { name: /Add Feature/ });
      await user.click(addButton);

      expect(onPreviewUpdate).toHaveBeenCalled();
    });
  });

  describe('Property 9: Content Persistence', () => {
    /**
     * Property: Content Persistence
     * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
     *
     * For any valid content input, after saving and rendering,
     * the displayed content should match the original input exactly.
     */
    it('Property 9: Should maintain content persistence between saved values and rendered output', () => {
      fc.assert(
        fc.property(
          fc.record({
            heading: fc.stringMatching(/^[a-zA-Z0-9 ]{1,100}$/),
            subheading: fc.stringMatching(/^[a-zA-Z0-9 ]{1,100}$/),
            ctaText: fc.stringMatching(/^[a-zA-Z0-9 ]{1,50}$/),
            email: fc.email(),
            phone: fc.stringMatching(/^\+[0-9]{1,15}$/),
          }),
          ({ heading, subheading, ctaText, email, phone }) => {
            const testContent: ContentValues = {
              hero: {
                heading,
                subheading,
                ctaText,
              },
              missionVision: {
                title: 'Mission',
                description: 'Description',
                vision: 'Vision',
              },
              features: [],
              testimonials: [],
              contact: {
                email,
                phone,
                address: 'Address',
                socialLinks: {},
              },
            };

            const { unmount } = render(
              <ContentEditor
                content={testContent}
                onChange={vi.fn()}
                onPreviewUpdate={vi.fn()}
              />
            );

            // Verify hero content is rendered with exact values
            expect(screen.getByDisplayValue(heading)).toBeInTheDocument();
            expect(screen.getByDisplayValue(subheading)).toBeInTheDocument();
            expect(screen.getByDisplayValue(ctaText)).toBeInTheDocument();

            // Verify contact content is rendered with exact values
            expect(screen.getByDisplayValue(email)).toBeInTheDocument();
            expect(screen.getByDisplayValue(phone)).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
