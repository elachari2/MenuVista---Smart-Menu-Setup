import React from 'react';
import { FileText, X } from 'lucide-react';

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}

/**
 * Composant de prévisualisation Enterprise SaaS avec Lucide Icons (FileText, X) et 0 émoji
 */
export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  disabled,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} Ko`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  return (
    <div className="bg-primary-50/60 border border-primary-200 rounded-xl p-4 flex items-center justify-between my-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 truncate max-w-md">
            {file.name}
          </span>
          <span className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </span>
        </div>
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Changer de fichier"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
