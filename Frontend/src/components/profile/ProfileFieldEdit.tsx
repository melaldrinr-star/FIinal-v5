import React from 'react';
import { Input } from '../ui/input';

type FieldType = 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'select';

interface ProfileFieldEditProps {
  label: string;
  name: string;
  value: string;
  type?: FieldType;
  onChange: (name: string, value: string) => void;
  onBlur?: (name: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  options?: { label: string; value: string }[];
  className?: string;
}

export function ProfileFieldEdit({
  label,
  name,
  value,
  type = 'text',
  onChange,
  onBlur,
  error,
  required = false,
  placeholder = '',
  disabled = false,
  options = [],
  className = '',
}: ProfileFieldEditProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(name, e.target.value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={() => onBlur?.(name)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-destructive' : 'border-input'
          }`}
          rows={3}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={() => onBlur?.(name)}
          disabled={disabled}
          className={`w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-destructive' : 'border-input'
          }`}
        >
          <option value="">Select an option</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={() => onBlur?.(name)}
          placeholder={placeholder}
          disabled={disabled}
          className={error ? 'border-destructive' : ''}
        />
      )}

      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}
