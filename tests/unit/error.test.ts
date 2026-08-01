import { describe, it, expect } from 'vitest';
import { sanitizeDatabaseError } from '@/lib/utils/error';

describe('sanitizeDatabaseError', () => {
  const fallback = 'An unexpected system error occurred. Please try again later.';

  it('should return fallback message when error is null or undefined', () => {
    expect(sanitizeDatabaseError(null)).toBe(fallback);
    expect(sanitizeDatabaseError(undefined)).toBe(fallback);
  });

  it('should return custom fallback message when specified', () => {
    const customFallback = 'Custom fallback error.';
    expect(sanitizeDatabaseError(null, customFallback)).toBe(customFallback);
  });

  it('should return the original message if it does not contain sensitive database keywords', () => {
    const safeError = new Error('Connection timed out. Please try again.');
    expect(sanitizeDatabaseError(safeError)).toBe('Connection timed out. Please try again.');

    const safeString = 'No internet access';
    expect(sanitizeDatabaseError(safeString)).toBe('No internet access');
  });

  it('should return fallback message when the error contains database schema terms', () => {
    const sensitiveErrors = [
      new Error('database schema cache lookup failed'),
      new Error('could not find profiles table'),
      new Error('relation "profiles" does not exist'),
      new Error('column "gender" does not exist'),
      new Error('syntax error at or near "SELECT"'),
      new Error('insert violates foreign key constraint'),
      new Error('violates check constraint "age_check"'),
      new Error('PGRST116: no rows returned'),
      new Error('Postgres error code 42P01'),
      'raw database failure text here',
    ];

    sensitiveErrors.forEach((err) => {
      expect(sanitizeDatabaseError(err)).toBe(fallback);
    });
  });

  it('should return specific user-friendly messages for known constraints', () => {
    expect(sanitizeDatabaseError(new Error('duplicate key value violates unique constraint "submissions_listing_id_tester_id_key"')))
      .toBe('You have already claimed a slot for this listing. Please check your active tasks.');

    expect(sanitizeDatabaseError(new Error('violates row level security policy for profiles')))
      .toBe('Access denied. You do not have permission to perform this action.');
  });

  it('should handle custom objects with a message property', () => {
    const objError = { message: 'relation "profiles" not found' };
    expect(sanitizeDatabaseError(objError)).toBe(fallback);

    const safeObjError = { message: 'Some safe message' };
    expect(sanitizeDatabaseError(safeObjError)).toBe('Some safe message');
  });

  it('should convert non-error values to string and sanitize them', () => {
    expect(sanitizeDatabaseError(404)).toBe('404');
    expect(sanitizeDatabaseError('database error')).toBe(fallback);
  });
});
