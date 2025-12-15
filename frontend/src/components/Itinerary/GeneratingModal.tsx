import { Loader2, Sparkles } from "lucide-react";

type Props = {
  isOpen: boolean;
};

export default function GeneratingModal({ isOpen }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 relative overflow-hidden">
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
            <Loader2 className="h-16 w-16 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Te avisaremos tan pronto lo tengamos listo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
