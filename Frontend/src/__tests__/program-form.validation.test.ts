/**
 * Phase 4.5 Form Validation Tests - Program Enrollment Limit Field
 * 
 * These tests validate the enrollment limit field validation logic used in ProgramFormPage.
 * The tests cover form field validation rules for the enrollment limit input field.
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 1.3, 15.4, 15.5**
 */

import { describe, it, expect } from 'vitest';

/**
 * Form validation logic extracted from ProgramFormPage.tsx validateStep function
 * This simulates the validation that occurs when step 2 is validated
 */
interface FormData {
  name: string;
  description: string;
  durationWeeks: string;
  level: string;
  startDate: string;
  endDate: string;
  enrollmentLimit: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Replicate the validation logic from ProgramFormPage for testing
function validateProgramFormStep2(
  formData: Partial<FormData>,
  isCreating: boolean
): ValidationResult {
  const errors: Record<string, string> = {};

  // Duration validation
  if (!formData.durationWeeks?.trim() || isNaN(parseInt(formData.durationWeeks ?? '')) || parseInt(formData.durationWeeks ?? '') < 1) {
    errors.durationWeeks = 'Enter a valid duration (at least 1 week)';
  }

  // Level validation
  if (!formData.level) {
    errors.level = 'Please select a level';
  }

  // Start date validation
  if (!formData.startDate) {
    errors.startDate = 'Start date is required';
  }

  // End date validation
  if (!formData.endDate) {
    errors.endDate = 'End date is required';
  }

  // Date range validation
  if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
    errors.endDate = 'End date must be after start date';
  }

  // ============================================================================
  // ENROLLMENT LIMIT VALIDATION
  // ============================================================================

  // Required for new programs (creating)
  if (isCreating) {
    if (!formData.enrollmentLimit?.trim()) {
      errors.enrollmentLimit = 'Enrollment limit is required for new programs';
    } else {
      const limit = parseInt(formData.enrollmentLimit);
      // [TEST CASE 1] Validate minimum value
      if (isNaN(limit) || limit < 1) {
        errors.enrollmentLimit = 'Enrollment limit must be at least 1';
      }
      // [TEST CASE 2] Validate maximum value
      else if (limit > 10000) {
        errors.enrollmentLimit = 'Enrollment limit must not exceed 10,000';
      }
    }
  } else {
    // Optional for existing programs (updating), but validate if provided
    if (formData.enrollmentLimit?.trim()) {
      const limit = parseInt(formData.enrollmentLimit);
      if (isNaN(limit) || limit < 1) {
        errors.enrollmentLimit = 'Enrollment limit must be at least 1';
      } else if (limit > 10000) {
        errors.enrollmentLimit = 'Enrollment limit must not exceed 10,000';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

describe('Program Form Validation - Phase 4.5 Enrollment Limit Field', () => {
  describe('[TEST CASE 1] Enrollment Limit Minimum Validation', () => {
    it('should fail validation with value 0, displaying message "Enrollment limit must be at least 1"', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '0', // Invalid: below minimum
      };

      const result = validateProgramFormStep2(formData, true); // Creating

      expect(result.isValid).toBe(false);
      expect(result.errors.enrollmentLimit).toBe('Enrollment limit must be at least 1');
    });

    it('should fail validation with negative value -5', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '-5',
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.isValid).toBe(false);
      expect(result.errors.enrollmentLimit).toBe('Enrollment limit must be at least 1');
    });

    it('should pass validation with value 1 (minimum boundary)', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '1', // Valid: exactly minimum
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.isValid).toBe(true);
      expect(result.errors.enrollmentLimit).toBeUndefined();
    });
  });

  describe('[TEST CASE 2] Enrollment Limit Maximum Validation', () => {
    it('should fail validation with value 10001, displaying message "Enrollment limit must not exceed 10,000"', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '10001', // Invalid: above maximum
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.isValid).toBe(false);
      expect(result.errors.enrollmentLimit).toBe('Enrollment limit must not exceed 10,000');
    });

    it('should fail validation with value 50000', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '50000',
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.isValid).toBe(false);
      expect(result.errors.enrollmentLimit).toBe('Enrollment limit must not exceed 10,000');
    });

    it('should pass validation with value 10000 (maximum boundary)', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '10000', // Valid: exactly maximum
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.isValid).toBe(true);
      expect(result.errors.enrollmentLimit).toBeUndefined();
    });
  });

  describe('Valid Enrollment Limit Values', () => {
    it('should accept mid-range value 30', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '30',
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.isValid).toBe(true);
      expect(result.errors.enrollmentLimit).toBeUndefined();
    });

    it('should accept mid-range value 100', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '100',
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.isValid).toBe(true);
      expect(result.errors.enrollmentLimit).toBeUndefined();
    });

    it('should accept value 5000', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '5000',
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.isValid).toBe(true);
      expect(result.errors.enrollmentLimit).toBeUndefined();
    });
  });

  describe('[TEST CASE 3 & 4] Form Submission Behavior with Enrollment Limit', () => {
    it('should prevent form submission when enrollment limit validation fails', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '0', // Invalid
      };

      const result = validateProgramFormStep2(formData, true);

      // Form submission should be blocked (isValid = false)
      expect(result.isValid).toBe(false);
    });

    it('[TEST CASE 4] should allow form submission when enrollment limit is valid', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '30', // Valid
      };

      const result = validateProgramFormStep2(formData, true);

      // Form submission should be allowed (isValid = true)
      expect(result.isValid).toBe(true);
    });

    it('[TEST CASE 5] should resolve error message when enrollment limit is corrected from 0 to 30', () => {
      // Step 1: Invalid value
      const formDataInvalid: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '0',
      };

      const resultInvalid = validateProgramFormStep2(formDataInvalid, true);
      expect(resultInvalid.isValid).toBe(false);
      expect(resultInvalid.errors.enrollmentLimit).toBe('Enrollment limit must be at least 1');

      // Step 2: User corrects the value
      const formDataValid: Partial<FormData> = {
        ...formDataInvalid,
        enrollmentLimit: '30', // Corrected
      };

      const resultValid = validateProgramFormStep2(formDataValid, true);
      expect(resultValid.isValid).toBe(true);
      expect(resultValid.errors.enrollmentLimit).toBeUndefined();
    });

    it('[TEST CASE 5] should resolve error message when enrollment limit is corrected from 10001 to 10000', () => {
      // Step 1: Invalid value above maximum
      const formDataInvalid: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '10001',
      };

      const resultInvalid = validateProgramFormStep2(formDataInvalid, true);
      expect(resultInvalid.isValid).toBe(false);
      expect(resultInvalid.errors.enrollmentLimit).toBe('Enrollment limit must not exceed 10,000');

      // Step 2: User corrects the value
      const formDataValid: Partial<FormData> = {
        ...formDataInvalid,
        enrollmentLimit: '10000', // Corrected
      };

      const resultValid = validateProgramFormStep2(formDataValid, true);
      expect(resultValid.isValid).toBe(true);
      expect(resultValid.errors.enrollmentLimit).toBeUndefined();
    });
  });

  describe('Create Mode - Field Required Behavior', () => {
    it('should fail validation when enrollment limit is empty in create mode (new program)', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '', // Empty
      };

      const result = validateProgramFormStep2(formData, true); // isCreating = true

      expect(result.isValid).toBe(false);
      expect(result.errors.enrollmentLimit).toBe('Enrollment limit is required for new programs');
    });

    it('should fail validation when enrollment limit is whitespace in create mode', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '   ', // Whitespace only
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.isValid).toBe(false);
      expect(result.errors.enrollmentLimit).toBe('Enrollment limit is required for new programs');
    });
  });

  describe('Edit Mode - Field Optional Behavior', () => {
    it('should pass validation when enrollment limit is empty in edit mode (existing program)', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '', // Empty
      };

      const result = validateProgramFormStep2(formData, false); // isCreating = false (edit mode)

      expect(result.isValid).toBe(true); // Should pass - field is optional
      expect(result.errors.enrollmentLimit).toBeUndefined();
    });

    it('should pass validation when enrollment limit is whitespace in edit mode', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '   ',
      };

      const result = validateProgramFormStep2(formData, false);

      expect(result.isValid).toBe(true);
      expect(result.errors.enrollmentLimit).toBeUndefined();
    });

    it('should still validate range constraints in edit mode when enrollment limit is provided', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '0', // Provided but invalid
      };

      const result = validateProgramFormStep2(formData, false);

      expect(result.isValid).toBe(false);
      expect(result.errors.enrollmentLimit).toBe('Enrollment limit must be at least 1');
    });

    it('should accept valid enrollment limit in edit mode', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '50', // Valid value
      };

      const result = validateProgramFormStep2(formData, false);

      expect(result.isValid).toBe(true);
      expect(result.errors.enrollmentLimit).toBeUndefined();
    });
  });

  describe('Error Message Content and Clarity', () => {
    it('should provide clear error message for minimum validation failure', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '0',
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.errors.enrollmentLimit).toContain('at least 1');
    });

    it('should provide clear error message for maximum validation failure', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '10001',
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.errors.enrollmentLimit).toContain('10,000');
    });

    it('should provide clear error message for required field failure', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '',
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.errors.enrollmentLimit).toContain('required');
    });
  });

  describe('Validation with Other Form Fields', () => {
    it('should only report enrollment limit error when it is the only validation issue', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '0', // Only issue
      };

      const result = validateProgramFormStep2(formData, true);

      expect(Object.keys(result.errors)).toEqual(['enrollmentLimit']);
    });

    it('should report multiple errors including enrollment limit when other fields are invalid', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '', // Missing
        level: '', // Missing
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '0', // Invalid
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.errors).toHaveProperty('durationWeeks');
      expect(result.errors).toHaveProperty('level');
      expect(result.errors).toHaveProperty('enrollmentLimit');
    });

    it('should not report enrollment limit error when other fields are invalid but enrollment limit is valid', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '', // Missing
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '30', // Valid
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.errors).toHaveProperty('durationWeeks');
      expect(result.errors).not.toHaveProperty('enrollmentLimit');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle non-numeric enrollment limit gracefully', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: 'abc', // Non-numeric
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.isValid).toBe(false);
      expect(result.errors.enrollmentLimit).toBe('Enrollment limit must be at least 1');
    });

    it('should handle decimal enrollment limit correctly', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '30.5', // Decimal
      };

      const result = validateProgramFormStep2(formData, true);

      // parseInt truncates decimal, so 30.5 becomes 30 which is valid
      expect(result.isValid).toBe(true);
    });

    it('should handle very large numbers correctly', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '999999999999', // Very large
      };

      const result = validateProgramFormStep2(formData, true);

      expect(result.isValid).toBe(false);
      expect(result.errors.enrollmentLimit).toBe('Enrollment limit must not exceed 10,000');
    });

    it('should handle leading/trailing spaces in numeric input', () => {
      const formData: Partial<FormData> = {
        durationWeeks: '4',
        level: 'Beginner',
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        enrollmentLimit: '  30  ', // Spaces around number
      };

      // parseInt handles leading/trailing spaces
      const result = validateProgramFormStep2(formData, true);

      expect(result.isValid).toBe(true);
    });
  });
});
