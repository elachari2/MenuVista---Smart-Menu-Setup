import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * Composant de bouton réutilisable respectant la charte graphique MenuVista.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold text-sm py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles =
    variant === 'primary'
      ? 'bg-brand-orange text-white hover:bg-brand-orange-hover shadow-sm active:translate-y-0.5'
      : 'border-2 border-brand-orange text-brand-orange bg-white hover:bg-brand-orange-light active:bg-brand-orange/10';

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin-custom mr-2" />
      )}
      {children}
    </button>
  );
};
