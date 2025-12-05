import React from 'react';
import type { LucideIcon } from 'lucide-react';

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
};

/**
 * Wrapper for form fields with consistent label styling
 */
export function FormField({ id, label, required, icon: Icon, iconColor = 'text-cyan-500', children }: FormFieldProps) {
  return (
    <div>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2"
      >
        {Icon && <Icon className={`h-4 w-4 ${iconColor}`} />}
        {label} {required && '*'}
      </label>
      {children}
    </div>
  );
}

type TextInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'url' | 'email';
  icon?: LucideIcon;
  iconColor?: string;
};

/**
 * Styled text input field
 */
export function TextInput({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  required, 
  type = 'text',
  icon,
  iconColor
}: TextInputProps) {
  return (
    <FormField id={id} label={label} required={required} icon={icon} iconColor={iconColor}>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
        placeholder={placeholder}
      />
    </FormField>
  );
}

type TextAreaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
};

/**
 * Styled textarea field
 */
export function TextArea({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  required,
  rows = 3
}: TextAreaProps) {
  return (
    <FormField id={id} label={label} required={required}>
      <textarea
        id={id}
        required={required}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none"
        placeholder={placeholder}
      />
    </FormField>
  );
}

type NumberInputProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  min?: number;
  step?: string;
  icon?: LucideIcon;
  iconColor?: string;
};

/**
 * Styled number input field
 */
export function NumberInput({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  required,
  min = 0,
  step = '0.01',
  icon,
  iconColor
}: NumberInputProps) {
  return (
    <FormField id={id} label={label} required={required} icon={icon} iconColor={iconColor}>
      <input
        id={id}
        type="number"
        step={step}
        min={min}
        required={required}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
        placeholder={placeholder}
      />
    </FormField>
  );
}

type DateTimeInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  icon?: LucideIcon;
  iconColor?: string;
};

/**
 * Styled datetime-local input field
 */
export function DateTimeInput({ 
  id, 
  label, 
  value, 
  onChange, 
  required,
  icon,
  iconColor
}: DateTimeInputProps) {
  return (
    <FormField id={id} label={label} required={required} icon={icon} iconColor={iconColor}>
      <input
        id={id}
        type="datetime-local"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
      />
    </FormField>
  );
}

type CheckboxFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/**
 * Styled checkbox field with label
 */
export function CheckboxField({ id, label, checked, onChange }: CheckboxFieldProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-gray-300 dark:border-gray-600 rounded transition-all"
      />
      <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}

type FormErrorProps = {
  error: string | null;
};

/**
 * Form error message display
 */
export function FormError({ error }: FormErrorProps) {
  if (!error) return null;
  
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl" role="alert">
      <strong className="font-medium">Error:</strong> {error}
    </div>
  );
}
