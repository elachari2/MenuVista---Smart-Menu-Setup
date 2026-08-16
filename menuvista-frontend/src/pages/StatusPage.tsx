import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { Footer } from '../components/Layout/Footer';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { AlertBanner } from '../components/UI/AlertBanner';
import { useJobStatus } from '../hooks/useJobStatus';
import { Sparkles, Loader2, ArrowLeft } from 'lucide-react';

/**
 * Page de transition avec redirection automatique instantanée vers le menu structuré dès la fin de l'OCR.
 * Évite d'afficher les informations techniques du job au restaurateur.
 */
export const StatusPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading, isError, error, refetch } = useJobStatus(jobId || '');

  // Redirection automatique instantanée dès que le menu est structuré et disponible
  useEffect(() => {
    if (job?.status === 'ocr_termine' && job.menuId) {
      navigate(`/menu-preview/${job.menuId}`, { replace: true });
    }
  }, [job, navigate]);

  const handleNewMenu = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF8F6] text-[#1E1A18]">
      <div>
        <Header />

        <main className="max-w-xl mx-auto px-4 py-12">
          <Card className="p-8 bg-white rounded-3xl border border-[#E8E4E0] shadow-sm text-center">
            {/* Erreur de récupération du job */}
            {isError && (
              <div className="space-y-4">
                <AlertBanner
                  title="Erreur de Numérisation"
                  message={
                    error?.message ||
                    'Impossible de récupérer le traitement du menu. Le serveur est inaccessible ou le job n\'existe pas.'
                  }
                  onRetry={() => refetch()}
                  retryLabel="Recharger"
                />
                <div className="pt-4 flex justify-center">
                  <Button variant="outline" onClick={handleNewMenu} className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Nouveau menu</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Échec du traitement OCR */}
            {job?.status === 'echec' && (
              <div className="space-y-4">
                <AlertBanner
                  title="Échec du traitement du menu"
                  message={job.errorMessage || 'Une erreur est survenue lors de l\'extraction. Veuillez réessayer avec une image plus lisible.'}
                  onRetry={() => refetch()}
                  retryLabel="Réessayer"
                />
                <div className="pt-4 flex justify-center">
                  <Button variant="outline" onClick={handleNewMenu} className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Téléverser une autre photo</span>
                  </Button>
                </div>
              </div>
            )}

            {/* État de chargement / Traitement en cours (OCR + Structuration IA) */}
            {(isLoading || (job && job.status !== 'echec')) && (
              <div className="py-8 space-y-6 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-[#FDF0EB] border border-[#FADBD8]">
                  <Loader2 className="w-10 h-10 text-[#E85D2C] animate-spin" />
                  <Sparkles className="w-5 h-5 text-[#E85D2C] absolute top-2 right-2 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-[#1E1A18] tracking-tight">
                    Numérisation du menu en cours...
                  </h2>
                  <p className="text-sm text-[#5A554F] max-w-sm mx-auto leading-relaxed">
                    Extraction des catégories, des plats, des prix et enrichissement IA en cours. Vous allez être redirigé automatiquement vers votre menu final.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#E85D2C] bg-[#FDF0EB] px-4 py-2 rounded-full border border-[#FADBD8]">
                  <span className="w-2 h-2 rounded-full bg-[#E85D2C] animate-ping" />
                  <span>Traitement IA actif &mdash; Redirection imminente</span>
                </div>
              </div>
            )}
          </Card>
        </main>
      </div>

      <Footer />
    </div>
  );
};
