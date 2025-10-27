import { validateEmail, validatePassword, validateRequiredField } from '@/lib/form-validation';

describe('Form Validation Functions', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('name.surname@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@example')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid passwords', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('LongSecurePassword123')).toBe(true);
    });

    it('should return false for passwords that are too short', () => {
      expect(validatePassword('Short1')).toBe(false);
    });

    it('should return false for passwords without required complexity', () => {
      expect(validatePassword('onlylowercase')).toBe(false);
      expect(validatePassword('ONLYUPPERCASE')).toBe(false);
      expect(validatePassword('123456789')).toBe(false);
    });
  });

  describe('validateRequiredField', () => {
    it('should return true for non-empty values', () => {
      expect(validateRequiredField('Some value')).toBe(true);
      expect(validateRequiredField('0')).toBe(true);
    });

    it('should return false for empty values', () => {
      expect(validateRequiredField('')).toBe(false);
      expect(validateRequiredField('   ')).toBe(false);
      expect(validateRequiredField(null)).toBe(false);
      expect(validateRequiredField(undefined)).toBe(false);
    });
  });
});