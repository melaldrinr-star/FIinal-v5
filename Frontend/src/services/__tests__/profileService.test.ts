import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhone,
  validateDateFormat,
  validateField,
  validateFields,
  ValidationError,
  ProfileField,
} from '../profileService';

describe('profileService', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'john.doe@company.co.uk',
        'test.email+tag@domain.org',
        'simple@example.com',
      ];

      validEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '',
      ];

      invalidEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should trim whitespace from email', () => {
      expect(validateEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('validatePhone', () => {
    it('should return true for valid phone numbers', () => {
      const validPhones = [
        '1234567890',
        '+1 (555) 123-4567',
        '+63 9123456789',
        '555-123-4567',
        '+1 555.123.4567',
      ];

      validPhones.forEach((phone) => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    it('should return false for invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        'abc-def-ghij',
        'phone number',
        '',
      ];

      invalidPhones.forEach((phone) => {
        expect(validatePhone(phone)).toBe(false);
      });
    });

    it('should remove formatting characters before validation', () => {
      expect(validatePhone('(555) 123-4567')).toBe(true);
      expect(validatePhone('555-123-4567')).toBe(true);
    });
  });

  describe('validateDateFormat', () => {
    it('should return true for valid past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(validateDateFormat(yesterday.toISOString())).toBe(true);
    });

    it('should return false for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(validateDateFormat(tomorrow.toISOString())).toBe(false);
    });

    it('should return false for invalid date strings', () => {
      const invalidDates = [
        'not-a-date',
        'invalid',
        '2024-13-45',
        '',
      ];

      invalidDates.forEach((date) => {
        expect(validateDateFormat(date)).toBe(false);
      });
    });
  });

  describe('validateField', () => {
    it('should return null for valid text field', () => {
      const field: ProfileField = {
        name: 'firstName',
        value: 'John',
        type: 'text',
      };

      expect(validateField(field)).toBeNull();
    });

    it('should return error for empty text field', () => {
      const field: ProfileField = {
        name: 'firstName',
        value: '',
        type: 'text',
      };

      const error = validateField(field);
      expect(error).not.toBeNull();
      expect(error?.field).toBe('firstName');
    });

    it('should validate email field type', () => {
      const validField: ProfileField = {
        name: 'email',
        value: 'user@example.com',
        type: 'email',
      };

      const invalidField: ProfileField = {
        name: 'email',
        value: 'invalid-email',
        type: 'email',
      };

      expect(validateField(validField)).toBeNull();
      expect(validateField(invalidField)).not.toBeNull();
    });

    it('should validate phone field type', () => {
      const validField: ProfileField = {
        name: 'phone',
        value: '1234567890',
        type: 'tel',
      };

      const invalidField: ProfileField = {
        name: 'phone',
        value: 'invalid',
        type: 'tel',
      };

      expect(validateField(validField)).toBeNull();
      expect(validateField(invalidField)).not.toBeNull();
    });
  });

  describe('validateFields', () => {
    it('should return empty array for all valid fields', () => {
      const fields: ProfileField[] = [
        { name: 'firstName', value: 'John', type: 'text' },
        { name: 'email', value: 'john@example.com', type: 'email' },
        { name: 'phone', value: '1234567890', type: 'tel' },
      ];

      const errors = validateFields(fields);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid fields', () => {
      const fields: ProfileField[] = [
        { name: 'firstName', value: '', type: 'text' },
        { name: 'email', value: 'invalid-email', type: 'email' },
      ];

      const errors = validateFields(fields);
      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('firstName');
      expect(errors[1].field).toBe('email');
    });

    it('should handle mixed valid and invalid fields', () => {
      const fields: ProfileField[] = [
        { name: 'firstName', value: 'John', type: 'text' },
        { name: 'email', value: 'invalid-email', type: 'email' },
        { name: 'phone', value: '1234567890', type: 'tel' },
      ];

      const errors = validateFields(fields);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
    });
  });
});
