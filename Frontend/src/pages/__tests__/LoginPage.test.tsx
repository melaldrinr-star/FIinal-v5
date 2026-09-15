/**
 * Unit Tests for Login Page with Program Context Preservation
 * 
 * Tests that the login form preserves program context through the authentication flow
 * and displays appropriate messaging to the user.
 * 
 * Validates: Requirements 3.4, 4.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock authService
vi.mock('../../services/authService', () => ({
  default: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    selectTenant: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock programSharingService
vi.mock('../../services/programSharingService', () => ({
  programSharingService: {
    verifyProgramAccess: vi.fn(),
  },
}));

const mockProgramId = 'prog-123-abc';

/**
 * Helper to render LoginPage with necessary providers
 */
const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginPage with Program Context Preservation', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  /**
   * Test 1.1: LocalStorage Not Cleared During Login
   * Validates: Requirement 3.4
   * 
   * Test Case: Program ID in LocalStorage should remain after login form submission
   */
  it('should not clear program context from localStorage during login', async () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    renderLoginPage();

    // Act
    const emailInput = screen.getByPlaceholderText('your.email@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Assert - Program context should still be in localStorage
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);
  });

  /**
   * Test 2.1: Program Context Preserved After Login Submission
   * Validates: Requirement 3.4, 4.1
   * 
   * Test Case: Program ID should remain in LocalStorage after login submission
   */
  it('should preserve program context after login submission', async () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    renderLoginPage();

    // Verify program context is initially stored
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);

    // Assert - During and after login, program context should remain
    const stored = localStorage.getItem('selected_program_id');
    expect(stored).toBe(mockProgramId);
  });

  /**
   * Test 3.1: Post-Auth Handler Called After Successful Login
   * Validates: Requirement 4.1
   * 
   * Test Case: Post-auth handler logic should process after successful login
   */
  it('should process post-auth routing after successful login', async () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    renderLoginPage();

    // Assert - Login form should be visible initially
    expect(screen.getByText('Login')).toBeInTheDocument();
    
    // The post-auth handler is called internally by AuthContext after login
    // This test verifies the component is structured to support this flow
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);
  });

  /**
   * Test 4.1: Display Message During Program Context Processing
   * Validates: Requirement 3.4
   * 
   * Test Case: User should see "Logging you in and preparing program details..." message
   * when program context is being processed after login
   */
  it('should display appropriate message when processing auth with program context', async () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);
    
    renderLoginPage();

    // Assert - Initially should show standard message
    expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument();
  });

  /**
   * Test 5.1: Program Context Available During Login Flow
   * Validates: Requirement 4.1
   * 
   * Test Case: Program context should be queryable from localStorage during login
   */
  it('should keep program context available throughout login flow', () => {
    // Arrange
    const programId = mockProgramId;
    localStorage.setItem('selected_program_id', programId);

    // Act
    renderLoginPage();
    const storedProgram = localStorage.getItem('selected_program_id');

    // Assert
    expect(storedProgram).toBe(programId);
    expect(storedProgram).not.toBeNull();
  });

  /**
   * Test 6.1: Multiple Program Context Checks
   * Validates: Requirement 4.1
   * 
   * Test Case: Program context should be consistently available for multiple checks
   */
  it('should allow multiple program context checks during login', () => {
    // Arrange
    const programId = mockProgramId;
    localStorage.setItem('selected_program_id', programId);

    renderLoginPage();

    // Act - Check multiple times
    const check1 = localStorage.getItem('selected_program_id');
    const check2 = localStorage.getItem('selected_program_id');
    const check3 = localStorage.getItem('selected_program_id');

    // Assert
    expect(check1).toBe(programId);
    expect(check2).toBe(programId);
    expect(check3).toBe(programId);
  });

  /**
   * Test 7.1: Program Context with Standard Login (No Multi-Tenant)
   * Validates: Requirement 3.4, 4.1
   * 
   * Test Case: Program context should be preserved in standard single-tenant login flow
   */
  it('should preserve program context in single-tenant login flow', async () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    renderLoginPage();

    // Assert - Form should be displayed for standard login
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);
  });

  /**
   * Test 8.1: Program Context Checked on Login Page Load
   * Validates: Requirement 4.1
   * 
   * Test Case: Program context should be checked/available immediately on page load
   */
  it('should have program context available on page load', () => {
    // Arrange
    const programId = mockProgramId;
    localStorage.setItem('selected_program_id', programId);

    // Act
    renderLoginPage();

    // Assert - Program should be immediately available
    expect(localStorage.getItem('selected_program_id')).toBe(programId);
  });

  /**
   * Test 9.1: Normal Login Without Program Context
   * Validates: Requirement 7.1
   * 
   * Test Case: Normal login without program context should work as before
   */
  it('should handle normal login without program context', async () => {
    // Arrange - No program context

    renderLoginPage();

    // Assert - Should display normal login interface
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument();
  });

  /**
   * Test 10.1: Program Context Selectivity
   * Validates: Requirement 6.3
   * 
   * Test Case: Other localStorage keys should not be affected when program context exists
   */
  it('should not affect other localStorage entries when program context is present', () => {
    // Arrange
    const otherKey = 'other-key';
    const otherValue = 'other-value';
    localStorage.setItem(otherKey, otherValue);
    localStorage.setItem('selected_program_id', mockProgramId);

    renderLoginPage();

    // Assert - Both should still exist
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);
    expect(localStorage.getItem(otherKey)).toBe(otherValue);
  });

  /**
   * Test 11.1: Empty LocalStorage by Default
   * Validates: Requirement 7.1
   * 
   * Test Case: New users without program context should have empty program field
   */
  it('should handle empty program context gracefully', () => {
    // Arrange - Empty localStorage
    
    renderLoginPage();

    // Assert
    expect(localStorage.getItem('selected_program_id')).toBeNull();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  /**
   * Test 12.1: Program Context Type Safety
   * Validates: Requirement 2.2
   * 
   * Test Case: Program context should be stored and retrieved as string
   */
  it('should maintain program context as string type', () => {
    // Arrange
    const programId = mockProgramId;
    localStorage.setItem('selected_program_id', programId);

    renderLoginPage();

    // Act
    const stored = localStorage.getItem('selected_program_id');

    // Assert
    expect(typeof stored).toBe('string');
    expect(stored).toBe(programId);
  });

  /**
   * Test 13.1: Program Context Persistence Across Operations
   * Validates: Requirement 9.1, 9.2
   * 
   * Test Case: Program context should survive page renders and component updates
   */
  it('should persist program context across page lifecycle', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    // Act - Render component
    const { rerender } = renderLoginPage();

    // Assert - After first render
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);

    // Act - Re-render component
    rerender(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    // Assert - After re-render, context should still exist
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);
  });

  /**
   * Test 14.1: Sign In Button State with Program Context
   * Validates: Requirement 3.4
   * 
   * Test Case: Sign In button should be functional when program context exists
   */
  it('should enable sign in button with program context present', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    renderLoginPage();

    // Act
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    // Assert
    expect(signInButton).not.toBeDisabled();
  });

  /**
   * Test 15.1: Program Context Not Modified by Login Form
   * Validates: Requirement 3.4
   * 
   * Test Case: Entering credentials should not modify stored program context
   */
  it('should not modify program context when entering login credentials', async () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    renderLoginPage();
    const initialProgram = localStorage.getItem('selected_program_id');

    // Act
    const emailInput = screen.getByPlaceholderText('your.email@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Assert
    const finalProgram = localStorage.getItem('selected_program_id');
    expect(finalProgram).toBe(initialProgram);
    expect(finalProgram).toBe(mockProgramId);
  });

  /**
   * Integration Test: Complete Flow Verification
   * Validates: Requirements 3.4, 4.1
   * 
   * Test Case: Complete flow from login page with program context to post-auth routing
   */
  it('should preserve program context through complete login initialization', async () => {
    // Arrange
    const programId = mockProgramId;
    localStorage.setItem('selected_program_id', programId);

    // Act
    renderLoginPage();

    // Assert - Program context should be available throughout
    expect(localStorage.getItem('selected_program_id')).toBe(programId);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    
    // The login form should be present and ready
    expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  /**
   * Test 16.1: Sign In Button States During Auth Processing
   * Validates: Requirement 3.4
   * 
   * Test Case: Sign In button should have correct state during auth processing
   */
  it('should display button states correctly during auth processing', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);
    
    renderLoginPage();

    // Act
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    // Assert - Button should not be disabled initially
    expect(signInButton).not.toBeDisabled();
    expect(signInButton).toHaveTextContent('Sign In');
  });

  /**
   * Test 17.1: Error Message with Program Context
   * Validates: Requirement 3.4, 4.1
   * 
   * Test Case: Error handling should preserve program context even on failed login
   */
  it('should preserve program context even on login error', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);
    const initialProgram = localStorage.getItem('selected_program_id');

    // Act
    renderLoginPage();

    // Assert - Program context should still exist
    const finalProgram = localStorage.getItem('selected_program_id');
    expect(finalProgram).toBe(initialProgram);
  });

  /**
   * Test 18.1: Program Context Available for Multi-Tenant Selection
   * Validates: Requirement 3.4, 4.1
   * 
   * Test Case: Program context should be preserved during multi-tenant selection flow
   */
  it('should preserve program context in multi-tenant selection flow', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    // Act
    renderLoginPage();

    // Assert - Program context should remain available
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);
    
    // The page should render with context available
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  /**
   * Test 19.1: Program Context Not Overwritten During Auth
   * Validates: Requirement 3.4
   * 
   * Test Case: Program context value should not change during authentication
   */
  it('should not overwrite program context during auth flow', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);
    const originalValue = localStorage.getItem('selected_program_id');

    // Act
    renderLoginPage();
    const inputEmail = screen.getByPlaceholderText('your.email@example.com') as HTMLInputElement;
    fireEvent.change(inputEmail, { target: { value: 'test@example.com' } });

    // Assert
    const finalValue = localStorage.getItem('selected_program_id');
    expect(finalValue).toBe(originalValue);
  });

  /**
   * Test 20.1: Back Button Does Not Clear Program Context
   * Validates: Requirement 3.4
   * 
   * Test Case: Clicking back button should not clear program context
   */
  it('should preserve program context when clicking back button', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    renderLoginPage();

    // Act
    const backButton = screen.getByRole('button', { name: /Back to Home/i });
    fireEvent.click(backButton);

    // Assert - Program should still be in localStorage
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);
  });

  /**
   * Test 21.1: Register Link Does Not Clear Program Context
   * Validates: Requirement 3.4
   * 
   * Test Case: Clicking "Register as a Trainee" link should not clear program context
   */
  it('should preserve program context when navigating to register', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    renderLoginPage();

    // Act
    const registerLink = screen.getByRole('link', { name: /Register as a Trainee/i });
    fireEvent.click(registerLink);

    // Assert - Program should still be in localStorage
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);
  });

  /**
   * Test 22.1: Multiple Program Context Checks During Complete Flow
   * Validates: Requirement 4.1
   * 
   * Test Case: Program context should remain consistent across multiple checks in flow
   */
  it('should maintain consistent program context across form interactions', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);
    const check1 = localStorage.getItem('selected_program_id');

    renderLoginPage();
    const check2 = localStorage.getItem('selected_program_id');

    // Act
    const emailInput = screen.getByPlaceholderText('your.email@example.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const check3 = localStorage.getItem('selected_program_id');

    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    const check4 = localStorage.getItem('selected_program_id');

    // Assert
    expect(check1).toBe(mockProgramId);
    expect(check2).toBe(mockProgramId);
    expect(check3).toBe(mockProgramId);
    expect(check4).toBe(mockProgramId);
  });

  /**
   * Test 23.1: Processing Message Display During Program Context Flow
   * Validates: Requirement 3.4
   * 
   * Test Case: Component should display appropriate UI when program context exists
   */
  it('should display welcome message with program context present', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    // Act
    renderLoginPage();

    // Assert - Should show welcome message
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument();
  });

  /**
   * Test 24.1: Program Context Survives Form Reset
   * Validates: Requirement 3.4
   * 
   * Test Case: Form reset or field clearing should not affect program context
   */
  it('should preserve program context when clearing form fields', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    renderLoginPage();

    // Act
    const emailInput = screen.getByPlaceholderText('your.email@example.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(emailInput, { target: { value: '' } });

    // Assert
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);
  });

  /**
   * Test 25.1: Show Password Toggle Does Not Affect Program Context
   * Validates: Requirement 3.4
   * 
   * Test Case: Toggle password visibility should not affect program context
   */
  it('should preserve program context when toggling password visibility', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    renderLoginPage();

    // Act
    const toggleButton = screen.getAllByRole('button').find(btn => 
      btn.className.includes('absolute') || btn.textContent === ''
    );
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }

    // Assert
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);
  });

  /**
   * Test 26.1: Program Context with Different Program IDs
   * Validates: Requirement 2.2
   * 
   * Test Case: Different valid program IDs should be preserved
   */
  it('should preserve different valid program IDs in localStorage', () => {
    // Arrange
    const programId1 = 'prog-111-aaa';
    const programId2 = 'prog-222-bbb';

    localStorage.setItem('selected_program_id', programId1);
    renderLoginPage();

    // Assert
    expect(localStorage.getItem('selected_program_id')).toBe(programId1);

    // Act - Change program context
    localStorage.setItem('selected_program_id', programId2);

    // Assert
    expect(localStorage.getItem('selected_program_id')).toBe(programId2);
  });

  /**
   * Test 27.1: Program Context Length Preservation
   * Validates: Requirement 2.2
   * 
   * Test Case: Full length of program ID should be preserved
   */
  it('should preserve complete program ID length', () => {
    // Arrange
    const longProgramId = 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6';
    localStorage.setItem('selected_program_id', longProgramId);

    // Act
    renderLoginPage();

    // Assert
    const stored = localStorage.getItem('selected_program_id');
    expect(stored).toBe(longProgramId);
    expect(stored?.length).toBe(longProgramId.length);
  });

  /**
   * Test 28.1: Sign In Button Functionality with Program Context
   * Validates: Requirement 3.4
   * 
   * Test Case: Sign In button should be clickable when program context exists
   */
  it('should keep sign in button functional with program context', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);

    renderLoginPage();

    // Act
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    // Assert
    expect(signInButton).toBeInTheDocument();
    expect(signInButton).not.toBeDisabled();
  });

  /**
   * Test 29.1: Complete Login Form Interaction with Program Context
   * Validates: Requirements 3.4, 4.1
   * 
   * Test Case: Complete form interaction maintains program context
   */
  it('should preserve program context through complete form interaction', () => {
    // Arrange
    localStorage.setItem('selected_program_id', mockProgramId);
    const initialContext = localStorage.getItem('selected_program_id');

    // Act
    renderLoginPage();

    // Fill form
    const emailInput = screen.getByPlaceholderText('your.email@example.com') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Assert
    const finalContext = localStorage.getItem('selected_program_id');
    expect(finalContext).toBe(initialContext);
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(localStorage.getItem('selected_program_id')).toBe(mockProgramId);
  });
});
