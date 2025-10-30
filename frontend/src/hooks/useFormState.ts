import React, { useState, useCallback } from 'react';

type ValidationRule<T> = (value: T) => string | null;

type FieldConfig<T> = {
  initialValue: T;
  validate?: ValidationRule<T>;
};

type FormConfig<T extends Record<string, unknown>> = {
  [K in keyof T]: FieldConfig<T[K]>;
};

type FormState<T extends Record<string, unknown>> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
};

type FormActions<T extends Record<string, unknown>> = {
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  setError: <K extends keyof T>(field: K, error: string | null) => void;
  validateField: <K extends keyof T>(field: K) => boolean;
  validateForm: () => boolean;
  reset: (newValues?: Partial<T>) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e: React.FormEvent) => Promise<void>;
};

export function useFormState<T extends Record<string, unknown>>(
  config: FormConfig<T>
): FormState<T> & FormActions<T> {
  // Initialize form state
  const initialValues = Object.keys(config).reduce((acc, key) => {
    acc[key as keyof T] = config[key as keyof T].initialValue;
    return acc;
  }, {} as T);

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});

  // Computed state
  const isValid = Object.keys(errors).length === 0;
  const isDirty = Object.keys(touched).length > 0;

  // Actions
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const setTouched = useCallback(<K extends keyof T>(field: K, touchedValue = true) => {
    setTouchedState(prev => ({ ...prev, [field]: touchedValue }));
  }, []);

  const setError = useCallback(<K extends keyof T>(field: K, error: string | null) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  }, []);

  const validateField = useCallback(<K extends keyof T>(field: K): boolean => {
    const fieldConfig = config[field];
    if (!fieldConfig?.validate) return true;

    const error = fieldConfig.validate(values[field]);
    setError(field, error);
    return !error;
  }, [config, values, setError]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isFormValid = true;

    Object.keys(config).forEach(key => {
      const field = key as keyof T;
      const fieldConfig = config[field];
      if (fieldConfig?.validate) {
        const error = fieldConfig.validate(values[field]);
        if (error) {
          newErrors[field] = error;
          isFormValid = false;
        }
      }
    });

    setErrors(newErrors);
    // Mark all fields as touched
    const allTouched = Object.keys(config).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Partial<Record<keyof T, boolean>>);
    setTouchedState(allTouched);

    return isFormValid;
  }, [config, values]);

  const reset = useCallback((newValues?: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
    setErrors({});
    setTouchedState({});
  }, []);

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) =>
      async (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
          try {
            await onSubmit(values);
          } catch (error) {
            console.error('Form submission error:', error);
          }
        }
      },
    [validateForm, values]
  );

  return {
    // State
    values,
    errors,
    touched,
    isValid,
    isDirty,

    // Actions
    setValue,
    setTouched,
    setError,
    validateField,
    validateForm,
    reset,
    handleSubmit,
  };
}