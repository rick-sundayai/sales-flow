/**
 * Custom hook for form validation using Zod schemas
 * Provides consistent validation across the application
 */

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { formatValidationErrors } from '@/lib/schemas/validation';

interface ValidationResult<T> {
  data: T | null;
  errors: Record<string, string>;
  isValid: boolean;
}

interface UseFormValidationReturn<T> {
  validate: (data: unknown) => ValidationResult<T>;
  validateField: (field: string, value: unknown) => string | null;
  errors: Record<string, string>;
  clearErrors: () => void;
  clearError: (field: string) => void;
  isValid: boolean;
}

/**
 * Hook for form validation with Zod schemas
 */
export function useFormValidation<T>(schema: z.ZodSchema<T>): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback((data: unknown): ValidationResult<T> => {
    try {
      const parsed = schema.parse(data);
      setErrors({});
      setIsValid(true);
      return {
        data: parsed,
        errors: {},
        isValid: true,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = formatValidationErrors(error);
        setErrors(formattedErrors);
        setIsValid(false);
        return {
          data: null,
          errors: formattedErrors,
          isValid: false,
        };
      }
      throw error;
    }
  }, [schema]);

  const validateField = useCallback((field: string, value: unknown): string | null => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = schema.shape?.[field as keyof typeof schema.shape];
      if (!fieldSchema) {
        return null;
      }

      fieldSchema.parse(value);
      
      // Clear the error for this field
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Invalid value';
        
        // Set the error for this field
        setErrors(prev => ({
          ...prev,
          [field]: errorMessage,
        }));
        
        return errorMessage;
      }
      return 'Validation error';
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(false);
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    validate,
    validateField,
    errors,
    clearErrors,
    clearError,
    isValid,
  };
}

/**
 * Hook for real-time form validation
 */
export function useRealtimeValidation<T>(
  schema: z.ZodSchema<T>,
  initialData: Partial<T> = {}
) {
  const { validate, validateField, errors, clearError } = useFormValidation(schema);
  const [data, setData] = useState<Partial<T>>(initialData);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field as string]: true }));
    
    // Validate field if it has been touched
    if (touched[field as string]) {
      validateField(field as string, value);
    }
  }, [touched, validateField]);

  const touchField = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field as string]: true }));
    
    // Validate the field when touched
    if (data[field] !== undefined) {
      validateField(field as string, data[field]);
    }
  }, [data, validateField]);

  const validateAll = useCallback(() => {
    return validate(data);
  }, [data, validate]);

  const resetForm = useCallback((newData: Partial<T> = {}) => {
    setData(newData);
    setTouched({});
  }, []);

  const hasErrors = Object.keys(errors).length > 0;
  const isFormValid = !hasErrors && Object.keys(data).length > 0;

  return {
    data,
    errors,
    touched,
    hasErrors,
    isFormValid,
    updateField,
    touchField,
    validateAll,
    resetForm,
    clearError,
  };
}

/**
 * Hook for async validation (e.g., checking if email exists)
 */
export function useAsyncValidation<T>(
  schema: z.ZodSchema<T>,
  asyncValidators: Record<string, (value: any) => Promise<string | null>> = {}
) {
  const { validate, errors, clearError } = useFormValidation(schema);
  const [asyncErrors, setAsyncErrors] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState<Record<string, boolean>>({});

  const validateFieldAsync = useCallback(async (field: string, value: any) => {
    const asyncValidator = asyncValidators[field];
    if (!asyncValidator) return;

    setValidating(prev => ({ ...prev, [field]: true }));

    try {
      const error = await asyncValidator(value);
      
      setAsyncErrors(prev => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    } catch (error) {
      setAsyncErrors(prev => ({
        ...prev,
        [field]: 'Validation failed',
      }));
    } finally {
      setValidating(prev => ({ ...prev, [field]: false }));
    }
  }, [asyncValidators]);

  const allErrors = { ...errors, ...asyncErrors };
  const isValidating = Object.values(validating).some(Boolean);

  return {
    validate,
    validateFieldAsync,
    errors: allErrors,
    asyncErrors,
    validating,
    isValidating,
    clearError,
  };
}