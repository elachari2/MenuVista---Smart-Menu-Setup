import React from 'react';
import { JobStatusEnum } from '../../types/menu.types';

interface OcrTextDisplayProps {
  status: JobStatusEnum;
  ocrText: string | null;
  errorMessage: string | null;
}

/**
 * Zone de texte scrollable affichant le texte brut extrait par l'OCR ou l'état de chargement/erreur.
 */
export const OcrTextDisplay: React.FC<OcrTextDisplayProps> = ({
  status,
  ocrText,
  errorMessage,
}) => {
  return (
    <div className="border border-brand-border rounded-xl bg-white overflow-hidden my-6">
      <div className="bg-brand-bg px-4 py-3 border-b border-brand-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-dark">
          Texte OCR extrait
        </h3>
        {status === 'ocr_termine' && (
          <span className="text-xs text-brand-muted">
            {ocrText ? `${ocrText.length} caractères` : 'Aucun texte'}
          </span>
        )}
      </div>

      <div className="p-4 min-h-[220px] max-h-[400px] overflow-y-auto bg-gray-50/50 font-mono text-sm leading-relaxed text-brand-dark">
        {(status === 'recu' || status === 'ocr_en_cours') && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <span className="w-8 h-8 border-3 border-brand-orange border-t-transparent rounded-full animate-spin-custom"></span>
            <p className="text-sm font-medium text-brand-muted animate-pulse-subtle">
              Analyse OCR du menu en cours... Veuillez patienter.
            </p>
          </div>
        )}

        {status === 'echec' && (
          <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
            <p className="font-semibold text-sm mb-1">
              Impossible d'extraire le texte du menu
            </p>
            <p className="text-xs font-mono">
              {errorMessage || 'Une erreur est survenue lors du traitement de l\'image par le moteur OCR.'}
            </p>
          </div>
        )}

        {status === 'ocr_termine' && (
          ocrText ? (
            <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-gray-800">
              {ocrText}
            </pre>
          ) : (
            <p className="text-sm text-brand-muted italic text-center py-8">
              Aucun texte n'a pu être extrait de l'image.
            </p>
          )
        )}
      </div>
    </div>
  );
};
