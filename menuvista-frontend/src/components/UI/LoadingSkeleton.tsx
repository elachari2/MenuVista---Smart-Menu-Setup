import React from 'react';

/**
 * Composant d'attente visuel (Skeleton Loader) pendant le chargement des requêtes.
 */
export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse-subtle">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-32 bg-gray-100 rounded-lg border border-brand-border mt-4"></div>
    </div>
  );
};
