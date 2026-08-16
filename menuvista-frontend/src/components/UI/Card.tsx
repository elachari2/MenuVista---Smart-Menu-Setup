import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Carte contenante élégante avec bordure fine et ombre douce.
 */
export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white border border-brand-border rounded-xl p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};
