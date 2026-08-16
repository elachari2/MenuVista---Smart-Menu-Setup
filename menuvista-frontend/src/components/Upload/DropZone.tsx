import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

/**
 * Zone de glisser-déposer Enterprise SaaS avec Lucide Icons (UploadCloud) et 0 émoji
 */
export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, disabled }) => {
  const [localError, setLocalError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: unknown[]) => {
      setLocalError(null);

      if (fileRejections.length > 0) {
        setLocalError(
          'Format ou taille non valide. Choisissez un fichier JPG ou PNG de moins de 5 Mo.',
        );
        return;
      }

      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 bg-white ${
          isDragActive
            ? 'border-primary-600 bg-primary-50 scale-[1.01]'
            : 'border-gray-300 hover:bg-gray-50 hover:border-primary-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100 shadow-2xs">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">
              Glissez votre photo de menu ici
            </p>
            <p className="text-xs text-gray-500 font-medium mt-1">
              JPG, PNG &mdash; Max 5 Mo
            </p>
          </div>
        </div>
      </div>

      {localError && (
        <p className="mt-2 text-xs font-semibold text-red-600 text-center">
          {localError}
        </p>
      )}
    </div>
  );
};
