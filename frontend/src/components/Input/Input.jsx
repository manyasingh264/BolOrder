// components/Input/Input.jsx
//
// Why it exists: Every form field needs a label, input, and error message.
//               Repeating this structure across 10+ forms causes duplication.
// Responsibility: Render a labeled input with accessible error display.
// Used by: LoginForm, UserForm, ShopForm, ProductForm, and every other form.

import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  id,
  required,
  hint,
  leftIcon,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label-base">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-surface-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`input-base ${leftIcon ? 'pl-10' : ''} ${error ? 'input-error' : ''} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>

      {hint && !error && (
        <p className="text-xs text-surface-400 mt-1.5">{hint}</p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="error-msg">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
