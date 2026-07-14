// components/Button/Button.jsx
//
// Why it exists: Every page needs buttons. Without this, button styles would be
//               repeated in every file. This component is the single button definition.
// Responsibility: Render a styled button with variants, loading state, and icon support.
// Used by: Every form, modal, page action — literally everywhere.
// Variants: primary | secondary | danger | ghost
// Sizes: sm | md (default) | lg

import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant  = 'primary',
  size     = 'md',
  isLoading = false,
  disabled  = false,
  leftIcon,
  rightIcon,
  className = '',
  type      = 'button',
  ...props
}) => {
  const variantClass = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
    ghost:     'btn-ghost',
  }[variant] ?? 'btn-primary';

  const sizeClass = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }[size] ?? '';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

export default Button;
