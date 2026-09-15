import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComponentToggler, { ComponentSettings } from './ComponentToggler';

/**
 * Component Tests: ComponentToggler
 *
 * Tests the component toggler sub-component for:
 * - Toggle switches work for each component
 * - Component-specific options shown/hidden correctly
 * - Preview updates when component enabled/disabled
 * - Component customizations saved correctly
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 7.1**
 */

const defaultComponents: ComponentSettings = {
  navigation: { enabled: true, style: 'light' },
  hero: { enabled: true, backgroundImage: '', overlayColor: 'rgba(0,0,0,0.3)', height: '500px' },
  features: { enabled: true, layout: 'grid', columns: 3 },
  testimonials: { enabled: true, displayCount: 3 },
  ctaSection: { enabled: true, style: 'button' },
  contact: { enabled: true, formFields: ['email', 'phone', 'message'] },
  footer: { enabled: true, linkColumns: 4 },
};

describe('ComponentToggler Component', () => {
  let onChange: ReturnType<typeof vi.fn>;
  let onPreviewUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
    onPreviewUpdate = vi.fn();
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render component toggler card with title', () => {
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByText('Component Visibility & Customization')).toBeInTheDocument();
      expect(
        screen.getByText(/Enable or disable landing page components/)
      ).toBeInTheDocument();
    });

    it('should render all component toggle switches', () => {
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Hero Section')).toBeInTheDocument();
      expect(screen.getByText('Features Section')).toBeInTheDocument();
      expect(screen.getByText('Testimonials Section')).toBeInTheDocument();
      expect(screen.getByText('Call-to-Action (CTA) Section')).toBeInTheDocument();
      expect(screen.getByText('Contact Section')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should render component-specific options when component is enabled', () => {
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      // Navigation style should be visible since navigation is enabled
      expect(screen.getByText('Navigation Style')).toBeInTheDocument();

      // Hero options should be visible since hero is enabled
      expect(screen.getByText('Background Image URL')).toBeInTheDocument();
    });
  });

  describe('Toggle Switches', () => {
    it('should toggle navigation component', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const navToggle = screen.getByRole('switch', { name: /Navigation/i });
      await user.click(navToggle);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          navigation: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });

    it('should toggle hero component', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const heroToggle = screen.getByRole('switch', { name: /Hero Section/i });
      await user.click(heroToggle);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          hero: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });

    it('should toggle features component', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const featuresToggle = screen.getByRole('switch', { name: /Features Section/i });
      await user.click(featuresToggle);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          features: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });

    it('should toggle testimonials component', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const testimonialToggle = screen.getByRole('switch', { name: /Testimonials Section/i });
      await user.click(testimonialToggle);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          testimonials: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });

    it('should toggle CTA component', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const ctaToggle = screen.getByRole('switch', { name: /Call-to-Action/i });
      await user.click(ctaToggle);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ctaSection: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });

    it('should toggle contact component', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const contactToggle = screen.getByRole('switch', { name: /Contact Section/i });
      await user.click(contactToggle);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          contact: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });

    it('should toggle footer component', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const footerToggle = screen.getByRole('switch', { name: /Footer/i });
      await user.click(footerToggle);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          footer: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });
  });

  describe('Component-Specific Options Visibility', () => {
    it('should hide component options when component is disabled', async () => {
      const user = userEvent.setup();
      const disabledComponents = {
        ...defaultComponents,
        hero: { ...defaultComponents.hero!, enabled: false },
      };

      render(
        <ComponentToggler
          components={disabledComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      // Hero options should not be visible
      expect(screen.queryByText('Background Image URL')).not.toBeInTheDocument();
    });

    it('should show hero component options when hero is enabled', () => {
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByText('Background Image URL')).toBeInTheDocument();
      expect(screen.getByText('Overlay Color (rgba)')).toBeInTheDocument();
      expect(screen.getByText('Hero Height (e.g., 500px)')).toBeInTheDocument();
    });

    it('should show features options when features are enabled', () => {
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByText('Features Layout')).toBeInTheDocument();
      expect(screen.getByText('Columns (for grid layout)')).toBeInTheDocument();
    });

    it('should show contact form fields when contact is enabled', () => {
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      expect(screen.getByText('Form Fields')).toBeInTheDocument();
    });
  });

  describe('Component Customization', () => {
    it('should update navigation style', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const navStyleSelect = screen.getByDisplayValue('Light');
      await user.click(navStyleSelect);
      const darkOption = screen.getByRole('option', { name: /Dark/ });
      await user.click(darkOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          navigation: expect.objectContaining({
            style: 'Dark',
          }),
        })
      );
    });

    it('should update hero background image', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const bgImageInput = screen.getByPlaceholderText('https://example.com/image.jpg');
      await user.type(bgImageInput, 'https://example.com/hero.jpg');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          hero: expect.objectContaining({
            backgroundImage: 'https://example.com/hero.jpg',
          }),
        })
      );
    });

    it('should update features layout', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const layoutSelect = screen.getByDisplayValue('Grid');
      await user.click(layoutSelect);
      const listOption = screen.getByRole('option', { name: /List/ });
      await user.click(listOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          features: expect.objectContaining({
            layout: 'List',
          }),
        })
      );
    });

    it('should update features columns', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const columnsSelect = screen.getByDisplayValue('3 Columns');
      await user.click(columnsSelect);
      const twoColOption = screen.getByRole('option', { name: /2 Columns/ });
      await user.click(twoColOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          features: expect.objectContaining({
            columns: 2,
          }),
        })
      );
    });

    it('should update testimonials display count', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const countSelect = screen.getByDisplayValue('3');
      await user.click(countSelect);
      const fiveOption = screen.getByRole('option', { name: /^5$/ });
      await user.click(fiveOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          testimonials: expect.objectContaining({
            displayCount: 5,
          }),
        })
      );
    });

    it('should update CTA style', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const styleSelect = screen.getByDisplayValue('Button');
      await user.click(styleSelect);
      const bannerOption = screen.getByRole('option', { name: /Banner/ });
      await user.click(bannerOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ctaSection: expect.objectContaining({
            style: 'Banner',
          }),
        })
      );
    });

    it('should toggle contact form fields', async () => {
      const user = userEvent.setup();
      const noFormFields = {
        ...defaultComponents,
        contact: { enabled: true, formFields: [] },
      };

      render(
        <ComponentToggler
          components={noFormFields}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const emailCheckbox = screen.getByRole('checkbox', { name: /Email/ });
      await user.click(emailCheckbox);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          contact: expect.objectContaining({
            formFields: expect.arrayContaining(['email']),
          }),
        })
      );
    });

    it('should update footer link columns', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const columnsSelect = screen.getByDisplayValue('4 Columns');
      await user.click(columnsSelect);
      const threeColOption = screen.getByRole('option', { name: /3 Columns/ });
      await user.click(threeColOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          footer: expect.objectContaining({
            linkColumns: 3,
          }),
        })
      );
    });
  });

  describe('Preview Updates', () => {
    it('should call onPreviewUpdate when component is toggled', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const navToggle = screen.getByRole('switch', { name: /Navigation/i });
      await user.click(navToggle);

      expect(onPreviewUpdate).toHaveBeenCalled();
    });

    it('should call onPreviewUpdate when component option changes', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const navStyleSelect = screen.getByDisplayValue('Light');
      await user.click(navStyleSelect);
      const darkOption = screen.getByRole('option', { name: /Dark/ });
      await user.click(darkOption);

      expect(onPreviewUpdate).toHaveBeenCalled();
    });
  });

  describe('Component State Management', () => {
    it('should preserve other component settings when updating one', async () => {
      const user = userEvent.setup();
      render(
        <ComponentToggler
          components={defaultComponents}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const navStyleSelect = screen.getByDisplayValue('Light');
      await user.click(navStyleSelect);
      const darkOption = screen.getByRole('option', { name: /Dark/ });
      await user.click(darkOption);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          navigation: expect.any(Object),
          hero: expect.any(Object),
          features: expect.any(Object),
          testimonials: expect.any(Object),
          ctaSection: expect.any(Object),
          contact: expect.any(Object),
          footer: expect.any(Object),
        })
      );
    });

    it('should handle enabling a previously disabled component', async () => {
      const user = userEvent.setup();
      const disabledNav = {
        ...defaultComponents,
        navigation: { enabled: false, style: 'light' },
      };

      const { rerender } = render(
        <ComponentToggler
          components={disabledNav}
          onChange={onChange}
          onPreviewUpdate={onPreviewUpdate}
        />
      );

      const navToggle = screen.getByRole('switch', { name: /Navigation/i });
      await user.click(navToggle);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          navigation: expect.objectContaining({
            enabled: true,
          }),
        })
      );
    });
  });
});
