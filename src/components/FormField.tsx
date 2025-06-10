// src/components/FormField.tsx
import React from 'react';

interface FormFieldProps {
  label: string;
  tooltip?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  options?: { value: string | number; label: string }[];
  type?: 'select' | 'number' | 'text';
  placeholder?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, tooltip, value, onChange, options, type = 'select', placeholder = "Select...", className }) => (
  <div className="form-field-container">
    <label>
      {label}:
      {type === 'select' ? (
        <select value={value} onChange={onChange} className={className}>
          <option value="" disabled>{placeholder}</option>
          {options?.map(opt => (
            <option key={opt.label} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange} className={className} />
      )}
    </label>
    {tooltip && <div className="info-tooltip">{tooltip}</div>}
  </div>
);