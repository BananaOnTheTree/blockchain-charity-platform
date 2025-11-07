import React from 'react';

const FormField = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  helperText, 
  required = false,
  rows,
  min,
  step,
  accept
}) => {
  const isTextarea = type === 'textarea';

  return (
    <div className="form-group">
      {label && (
        <label>
          {label}
          {required && ' *'}
        </label>
      )}
      
      {isTextarea ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows || 4}
          required={required}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          min={min}
          step={step}
          accept={accept}
        />
      )}
      
      {helperText && <span className="helper-text">{helperText}</span>}
    </div>
  );
};

export default FormField;
