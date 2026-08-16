import React from 'react';
import { JobStatusEnum } from '../../types/menu.types';

interface StatusBadgeProps {
  status: JobStatusEnum;
}

/**
 * Badge pilule affichant le statut du job avec des couleurs distinctes par état.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let label = 'EN COURS';
  let badgeStyles = 'bg-brand-pending text-white animate-pulse-subtle';

  if (status === 'ocr_termine') {
    label = 'TERMINÉ';
    badgeStyles = 'bg-brand-success text-white';
  } else if (status === 'echec') {
    label = 'ÉCHEC';
    badgeStyles = 'bg-brand-error text-white';
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeStyles}`}
    >
      {label}
    </span>
  );
};
