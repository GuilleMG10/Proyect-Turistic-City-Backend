import { Loader2, Sparkles } from "lucide-react";

type Props = {
  isOpen: boolean;
  progress: string;
};

export default function GeneratingModal({ isOpen, progress }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          <div className="flex items-center justify-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold">Generando Itinerario</h2>
          </div>
          <p className="text-center text-sm opacity-90 relative z-10">
            Se está creando tu itinerario personalizado...
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Spinner */}
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 text-primary-600 dark:text-primary-400 animate-spin" />
          </div>

          {/* Progress Text */}
          {progress && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                {progress}
              </p>
            </div>
          )}

          {/* Loading Steps */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2.5 h-2.5 bg-primary-600 dark:bg-primary-400 rounded-full animate-pulse"></div>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Analizando preferencias...</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2.5 h-2.5 bg-primary-600 dark:bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Consultando lugares disponibles...</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2.5 h-2.5 bg-primary-600 dark:bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Optimizando ruta...</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2.5 h-2.5 bg-primary-600 dark:bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Calculando costos y tiempos...</span>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Esto puede tomar unos segundos...
          </p>
        </div>
      </div>
    </div>
  );
}
