import { Loader2, Sparkles } from "lucide-react";

type Props = {
  isOpen: boolean;
  progress: string;
};

export default function GeneratingModal({ isOpen, progress }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="h-6 w-6 animate-pulse" />
            <h2 className="text-xl font-bold">Generando Itinerario</h2>
          </div>
          <p className="text-center text-sm opacity-90">
            Se está creando tu itinerario personalizado...
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Spinner */}
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
          </div>

          {/* Progress Text */}
          {progress && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {progress}
              </p>
            </div>
          )}

          {/* Loading Steps */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-gray-600 dark:text-gray-300">Analizando preferencias...</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-gray-600 dark:text-gray-300">Consultando lugares disponibles...</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span className="text-gray-600 dark:text-gray-300">Optimizando ruta...</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              <span className="text-gray-600 dark:text-gray-300">Calculando costos y tiempos...</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Esto puede tomar unos segundos...
          </p>
        </div>
      </div>
    </div>
  );
}
