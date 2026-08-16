import React from 'react';

interface AlertBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  type?: 'error' | 'warning';
}

/**
 * Bannière d'alerte pour l'affichage clair des erreurs réseau, d'invalidation ou d'échec serveur.
 */
export const AlertBanner: React.FC<AlertBannerProps> = ({
  title = 'Erreur',
  message,
  onRetry,
  retryLabel = 'Réessayer',
  type = 'error',
}) => {
  const bgStyles =
    type === 'error'
      ? 'bg-red-50 border-brand-error/30 text-red-900'
      : 'bg-amber-50 border-brand-pending/30 text-amber-900';

  const badgeStyles =
    type === 'error'
      ? 'bg-brand-error text-white'
      : 'bg-brand-pending text-white';

  return (
    <div className={`p-4 rounded-lg border ${bgStyles} my-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
      <div className="flex items-start gap-3">
        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded mt-0.5 ${badgeStyles}`}>
          {title}
        </span>
        <p className="text-sm font-medium">{message}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="self-start sm:self-auto text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};
