import { useState, useEffect } from 'react';

interface ValidationState {
  isValid: boolean;
  message: string;
}

interface ValidationRules {
  email?: boolean;
  password?: boolean;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}

export function useValidation(value: string, rules: ValidationRules) {
  const [validation, setValidation] = useState<ValidationState>({
    isValid: true,
    message: ''
  });

  useEffect(() => {
    validateField(value, rules);
  }, [value, rules]);

  const validateField = (val: string, validationRules: ValidationRules) => {
    if (validationRules.required && !val) {
      setValidation({ isValid: false, message: 'Este campo é obrigatório' });
      return;
    }

    if (validationRules.minLength && val.length < validationRules.minLength) {
      setValidation({ 
        isValid: false, 
        message: `Mínimo de ${validationRules.minLength} caracteres` 
      });
      return;
    }

    if (validationRules.maxLength && val.length > validationRules.maxLength) {
      setValidation({ 
        isValid: false, 
        message: `Máximo de ${validationRules.maxLength} caracteres` 
      });
      return;
    }

    if (validationRules.email && val) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        setValidation({ isValid: false, message: 'Email inválido' });
        return;
      }
    }

    if (validationRules.password && val) {
      if (val.length < 6) {
        setValidation({ isValid: false, message: 'Mínimo 6 caracteres' });
        return;
      }
      if (!/(?=.*[a-z])/.test(val)) {
        setValidation({ 
          isValid: false, 
          message: 'Deve conter letras minúsculas' 
        });
        return;
      }
      if (!/(?=.*[A-Z])/.test(val)) {
        setValidation({ 
          isValid: false, 
          message: 'Deve conter letras maiúsculas' 
        });
        return;
      }
      if (!/(?=.*\d)/.test(val)) {
        setValidation({ isValid: false, message: 'Deve conter números' });
        return;
      }
    }

    setValidation({ isValid: true, message: '' });
  };

  return validation;
}

export function useFormValidation(initialState: Record<string, string>) {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string, rules: ValidationRules) => {
    let error = '';

    if (rules.required && !value) {
      error = 'Este campo é obrigatório';
    } else if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        error = 'Email inválido';
      }
    } else if (rules.minLength && value.length < rules.minLength) {
      error = `Mínimo de ${rules.minLength} caracteres`;
    } else if (rules.password && value) {
      if (value.length < 6) {
        error = 'Mínimo 6 caracteres';
      } else if (!/(?=.*[a-z])/.test(value)) {
        error = 'Deve conter letras minúsculas';
      } else if (!/(?=.*[A-Z])/.test(value)) {
        error = 'Deve conter letras maiúsculas';
      } else if (!/(?=.*\d)/.test(value)) {
        error = 'Deve conter números';
      }
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (name: string, value: string, rules?: ValidationRules) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (rules && touched[name]) {
      validateField(name, value, rules);
    }
  };

  const handleBlur = (name: string, rules?: ValidationRules) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    if (rules) {
      validateField(name, values[name], rules);
    }
  };

  const resetForm = () => {
    setValues(initialState);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    resetForm,
    setValues
  };
}