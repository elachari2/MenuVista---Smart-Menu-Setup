import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { AlertBanner } from '../components/UI/AlertBanner';
import { DropZone } from '../components/Upload/DropZone';
import { FilePreview } from '../components/Upload/FilePreview';
import { useUpload } from '../hooks/useUpload';

/**
 * Page d'accueil de numérisation identique à la capture d'écran 1.
 */
export const UploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const uploadMutation = useUpload();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    uploadMutation.reset();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    uploadMutation.reset();
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;

    uploadMutation.mutate(selectedFile, {
      onSuccess: (data) => {
        navigate(`/jobs/${data.jobId}`);
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF8F6]">
      <div>
        <Header />

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-[#1E1A18] tracking-tight">
              Numérisez vos menus papier
            </h1>
            <p className="text-sm text-[#5A554F] mt-2 max-w-md mx-auto leading-relaxed">
              Téléversez une photo claire pour en extraire instantanément le texte et les informations par OCR.
            </p>
          </div>

          <Card className="p-6 bg-white rounded-2xl shadow-sm border border-[#E8E4E0]">
            {uploadMutation.isError && (
              <div className="mb-4">
                <AlertBanner
                  title="Échec de l'upload"
                  message={
                    uploadMutation.error?.message ||
                    'Impossible d\'envoyer le fichier au serveur. Vérifiez votre connexion.'
                  }
                  onRetry={handleAnalyze}
                  retryLabel="Réessayer"
                />
              </div>
            )}

            <DropZone
              onFileSelect={handleFileSelect}
              disabled={uploadMutation.isPending}
            />

            {selectedFile && (
              <FilePreview
                file={selectedFile}
                onRemove={handleRemoveFile}
                disabled={uploadMutation.isPending}
              />
            )}

            <div className="mt-6">
              <Button
                variant="primary"
                onClick={handleAnalyze}
                disabled={!selectedFile || uploadMutation.isPending}
                isLoading={uploadMutation.isPending}
                className="w-full bg-[#E85D2C] hover:bg-[#d44e1f] text-white py-3 font-bold text-sm rounded-xl transition-all shadow-xs"
              >
                {uploadMutation.isPending ? 'Téléversement en cours...' : 'Lancer l\'analyse \u2192'}
              </Button>
            </div>
          </Card>
        </main>
      </div>

      <footer className="py-6 border-t border-[#E8E4E0] text-center text-xs text-[#5A554F] bg-white">
        Conçu avec passion pour les restaurateurs &mdash;{' '}
        <span className="font-bold text-[#E85D2C]">MenuVista</span>
      </footer>
    </div>
  );
};
