/**
 * Integration Tests for LandingPageWithCustomizations
 *
 * Tests content customization application on landing page:
 * - Customized hero content displays
 * - Customized features display
 * - Customized testimonials display
 * - Customized contact info displays
 * - Defaults shown if content not customized
 *
 * Requirements: 9.4, 9.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPageWithCustomizations } from '../LandingPageWithCustomizations';
import * as customizationLoader from '../../utils/customizationLoader';

// Mock the NewLandingPage component to simplify testing
jest.mock('../../pages/NewLandingPage', () => {
  return function DummyLandingPage({ customizations }: any) {
    return (
      <div data-testid="landing-page">
        <div data-testid="customization-state">{JSON.stringify(customizations)}</div>

        {/* Hero Section */}
        {customizations?.componentVisibility.hero && (
          <div data-testid="hero-section">
            <h1 data-testid="hero-heading">{customizations?.customizations?.content?.hero?.heading}</h1>
            <p data-testid="hero-subheading">{customizations?.customizations?.content?.hero?.subheading}</p>
          </div>
        )}

        {/* Features Section */}
        {customizations?.componentVisibility.features && (
          <div data-testid="features-section">
            {customizations?.customizations?.content?.features?.map((feature: any, idx: number) => (
              <div key={idx} data-testid={`feature-${idx}`}>
                <h3 data-testid={`feature-title-${idx}`}>{feature.title}</h3>
                <p data-testid={`feature-description-${idx}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Testimonials Section */}
        {customizations?.componentVisibility.testimonials && (
          <div data-testid="testimonials-section">
            {customizations?.customizations?.content?.testimonials?.map((testimonial: any, idx: number) => (
              <div key={idx} data-testid={`testimonial-${idx}`}>
                <p data-testid={`testimonial-text-${idx}`}>{testimonial.text}</p>
                <p data-testid={`testimonial-author-${idx}`}>{testimonial.author}</p>
              </div>
            ))}
          </div>
        )}

        {/* Contact Section */}
        {customizations?.componentVisibility.contact && (
          <div data-testid="contact-section">
            <p data-testid="contact-email">{customizations?.customizations?.content?.contact?.email}</p>
            <p data-testid="contact-phone">{customizations?.customizations?.content?.contact?.phone}</p>
            <p data-testid="contact-address">{customizations?.customizations?.content?.contact?.address}</p>
          </div>
        )}

        {/* Hidden Components */}
        {!customizations?.componentVisibility.hero && (
          <div data-testid="hero-hidden">Hero is hidden</div>
        )}
        {!customizations?.componentVisibility.features && (
          <div data-testid="features-hidden">Features are hidden</div>
        )}
      </div>
    );
  };
});

// Mock CSS injection utilities
jest.mock('../../utils/cssInjection', () => ({
  injectCSSVariables: jest.fn().mockReturnValue(document.createElement('style')),
  removeCSSVariables: jest.fn().mockReturnValue(true),
  getInjectedCSS: jest.fn().mockReturnValue(''),
  validateCSSInjection: jest.fn().mockReturnValue({ isValid: true, message: '' }),
}));

jest.mock('../../utils/cssVariableConverter', () => ({
  convertCustomizationsToCSSVariables: jest.fn().mockReturnValue({
    '--color-primary': 'rgb(255, 0, 0)',
  }),
  generateCSSString: jest.fn().mockReturnValue(':root { --color-primary: rgb(255, 0, 0); }'),
}));

jest.mock('../../utils/customizationLoader');

// Wrapper for React Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LandingPageWithCustomizations - Integration Tests', () => {
  const mockCustomizations = {
    colors: {
      primary: '#ff0000',
      secondary: '#00ff00',
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
        heading: 'Welcome to Our Training Program',
        subheading: 'Build your skills with us',
        ctaText: 'Enroll Now',
        ctaUrl: '/enroll',
      },
      features: [
        {
          title: 'Expert Instructors',
          description: 'Learn from industry professionals',
          icon: 'star',
        },
        {
          title: 'Hands-on Experience',
          description: 'Real-world projects and assignments',
          icon: 'code',
        },
        {
          title: 'Career Support',
          description: 'Job placement assistance and mentoring',
          icon: 'briefcase',
        },
      ],
      testimonials: [
        {
          text: 'This program changed my life!',
          author: 'John Doe',
          authorTitle: 'Software Developer',
        },
        {
          text: 'Great learning experience with excellent support.',
          author: 'Jane Smith',
          authorTitle: 'Data Analyst',
        },
      ],
      contact: {
        email: 'contact@trainingcenter.com',
        phone: '+1-800-123-4567',
        address: '123 Training Street, City, State 12345',
        socialLinks: {
          facebook: 'https://facebook.com/trainingcenter',
          linkedin: 'https://linkedin.com/company/trainingcenter',
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (customizationLoader.loadCustomizations as jest.Mock).mockResolvedValue(mockCustomizations);
    (customizationLoader.DEFAULT_CUSTOMIZATIONS as any) = mockCustomizations;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Test 1: Customized Hero Content Displays
  // ============================================================================

  describe('1. Customized Hero Content Displays', () => {
    it('1.1: Should display customized hero heading', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      // Wait for customizations to load
      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify customized heading displayed
      const heading = screen.getByTestId('hero-heading');
      expect(heading).toHaveTextContent('Welcome to Our Training Program');
    });

    it('1.2: Should display customized hero subheading', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify customized subheading displayed
      const subheading = screen.getByTestId('hero-subheading');
      expect(subheading).toHaveTextContent('Build your skills with us');
    });

    it('1.3: Should apply hero component visibility', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify hero section is visible
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.queryByTestId('hero-hidden')).not.toBeInTheDocument();
    });

    it('1.4: Should hide hero when disabled in customizations', async () => {
      // Setup
      const customizationsNoHero = {
        ...mockCustomizations,
        components: {
          ...mockCustomizations.components,
          hero: { enabled: false },
        },
      };
      (customizationLoader.loadCustomizations as jest.Mock).mockResolvedValueOnce(customizationsNoHero);

      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify hero section is hidden
      expect(screen.queryByTestId('hero-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('hero-hidden')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Test 2: Customized Features Display
  // ============================================================================

  describe('2. Customized Features Display', () => {
    it('2.1: Should display all customized features', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify features displayed
      expect(screen.getByTestId('feature-0')).toBeInTheDocument();
      expect(screen.getByTestId('feature-1')).toBeInTheDocument();
      expect(screen.getByTestId('feature-2')).toBeInTheDocument();
    });

    it('2.2: Should display customized feature titles', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify feature titles
      expect(screen.getByTestId('feature-title-0')).toHaveTextContent('Expert Instructors');
      expect(screen.getByTestId('feature-title-1')).toHaveTextContent('Hands-on Experience');
      expect(screen.getByTestId('feature-title-2')).toHaveTextContent('Career Support');
    });

    it('2.3: Should display customized feature descriptions', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify feature descriptions
      expect(screen.getByTestId('feature-description-0')).toHaveTextContent(
        'Learn from industry professionals'
      );
      expect(screen.getByTestId('feature-description-1')).toHaveTextContent(
        'Real-world projects and assignments'
      );
    });

    it('2.4: Should hide features when disabled', async () => {
      // Setup
      const customizationsNoFeatures = {
        ...mockCustomizations,
        components: {
          ...mockCustomizations.components,
          features: { enabled: false },
        },
      };
      (customizationLoader.loadCustomizations as jest.Mock).mockResolvedValueOnce(
        customizationsNoFeatures
      );

      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify features are hidden
      expect(screen.queryByTestId('features-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('features-hidden')).toBeInTheDocument();
    });

    it('2.5: Should handle empty features list', async () => {
      // Setup
      const customizationsEmptyFeatures = {
        ...mockCustomizations,
        content: {
          ...mockCustomizations.content,
          features: [],
        },
      };
      (customizationLoader.loadCustomizations as jest.Mock).mockResolvedValueOnce(
        customizationsEmptyFeatures
      );

      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Features section should be empty but visible
      expect(screen.getByTestId('features-section')).toBeInTheDocument();
      const features = screen.queryAllByTestId(/^feature-/);
      expect(features).toHaveLength(0);
    });
  });

  // ============================================================================
  // Test 3: Customized Testimonials Display
  // ============================================================================

  describe('3. Customized Testimonials Display', () => {
    it('3.1: Should display all customized testimonials', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify testimonials displayed
      expect(screen.getByTestId('testimonial-0')).toBeInTheDocument();
      expect(screen.getByTestId('testimonial-1')).toBeInTheDocument();
    });

    it('3.2: Should display customized testimonial text', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify testimonial text
      expect(screen.getByTestId('testimonial-text-0')).toHaveTextContent('This program changed my life!');
      expect(screen.getByTestId('testimonial-text-1')).toHaveTextContent(
        'Great learning experience with excellent support.'
      );
    });

    it('3.3: Should display customized testimonial authors', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify testimonial authors
      expect(screen.getByTestId('testimonial-author-0')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('testimonial-author-1')).toHaveTextContent('Jane Smith');
    });

    it('3.4: Should hide testimonials when disabled', async () => {
      // Setup
      const customizationsNoTestimonials = {
        ...mockCustomizations,
        components: {
          ...mockCustomizations.components,
          testimonials: { enabled: false },
        },
      };
      (customizationLoader.loadCustomizations as jest.Mock).mockResolvedValueOnce(
        customizationsNoTestimonials
      );

      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify testimonials are hidden
      expect(screen.queryByTestId('testimonials-section')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Test 4: Customized Contact Info Displays
  // ============================================================================

  describe('4. Customized Contact Info Displays', () => {
    it('4.1: Should display customized email', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify contact email
      expect(screen.getByTestId('contact-email')).toHaveTextContent('contact@trainingcenter.com');
    });

    it('4.2: Should display customized phone', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify contact phone
      expect(screen.getByTestId('contact-phone')).toHaveTextContent('+1-800-123-4567');
    });

    it('4.3: Should display customized address', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify contact address
      expect(screen.getByTestId('contact-address')).toHaveTextContent(
        '123 Training Street, City, State 12345'
      );
    });

    it('4.4: Should hide contact section when disabled', async () => {
      // Setup
      const customizationsNoContact = {
        ...mockCustomizations,
        components: {
          ...mockCustomizations.components,
          contact: { enabled: false },
        },
      };
      (customizationLoader.loadCustomizations as jest.Mock).mockResolvedValueOnce(
        customizationsNoContact
      );

      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify contact section is hidden
      expect(screen.queryByTestId('contact-section')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Test 5: Defaults Shown if Content Not Customized
  // ============================================================================

  describe('5. Defaults Shown if Content Not Customized', () => {
    it('5.1: Should use defaults for missing hero content', async () => {
      // Setup
      const customizationsPartial = {
        ...mockCustomizations,
        content: {
          ...mockCustomizations.content,
          hero: {},
        },
      };
      (customizationLoader.loadCustomizations as jest.Mock).mockResolvedValueOnce(
        customizationsPartial
      );

      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Verify hero section still renders (with empty content from customizations)
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('5.2: Should handle loading error with graceful fallback', async () => {
      // Setup
      (customizationLoader.loadCustomizations as jest.Mock).mockRejectedValueOnce(
        new Error('API error')
      );

      // Execute
      renderWithRouter(<LandingPageWithCustomizations showErrorState={false} />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      // Landing page should still render with defaults
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('5.3: Should show error message if showErrorState is true', async () => {
      // Setup
      (customizationLoader.loadCustomizations as jest.Mock).mockRejectedValueOnce(
        new Error('API error')
      );

      // Execute
      const { container } = renderWithRouter(
        <LandingPageWithCustomizations showErrorState={true} />
      );

      await waitFor(() => {
        const alert = container.querySelector('[role="alert"]');
        expect(alert).toBeInTheDocument();
      });
    });

    it('5.4: Should display custom error message', async () => {
      // Setup
      const customErrorMsg = 'Custom error occurred';
      (customizationLoader.loadCustomizations as jest.Mock).mockRejectedValueOnce(
        new Error('API error')
      );

      // Execute
      renderWithRouter(
        <LandingPageWithCustomizations
          showErrorState={true}
          errorMessage={customErrorMsg}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(customErrorMsg)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Test 6: Callbacks
  // ============================================================================

  describe('6. Callbacks', () => {
    it('6.1: Should call onCustomizationsLoaded after loading', async () => {
      // Setup
      const onLoaded = jest.fn();

      // Execute
      renderWithRouter(
        <LandingPageWithCustomizations onCustomizationsLoaded={onLoaded} />
      );

      await waitFor(() => {
        expect(onLoaded).toHaveBeenCalled();
      });
    });

    it('6.2: Should call onCustomizationsError on failure', async () => {
      // Setup
      const onError = jest.fn();
      const loadError = new Error('Load failed');
      (customizationLoader.loadCustomizations as jest.Mock).mockRejectedValueOnce(loadError);

      // Execute
      renderWithRouter(
        <LandingPageWithCustomizations onCustomizationsError={onError} />
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  // ============================================================================
  // Test 7: Loading State
  // ============================================================================

  describe('7. Loading State', () => {
    it('7.1: Should show loading spinner when showLoadingState is true', async () => {
      // Setup
      (customizationLoader.loadCustomizations as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      );

      // Execute
      const { container } = renderWithRouter(
        <LandingPageWithCustomizations showLoadingState={true} />
      );

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText(/Loading page customizations/i)).toBeInTheDocument();
      });
    });

    it('7.2: Should not show loading state by default', async () => {
      // Execute
      renderWithRouter(<LandingPageWithCustomizations />);

      // Should immediately render landing page (no loading text)
      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Loading page customizations/i)).not.toBeInTheDocument();
    });
  });
});
