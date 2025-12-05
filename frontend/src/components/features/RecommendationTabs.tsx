import { Heart, Sparkles, MapPin } from "lucide-react";

type RecommendationType = 'favorites' | 'ai-suggested' | 'popular';

type Props = {
  activeType: RecommendationType;
  onTypeChange: (type: RecommendationType) => void;
};

export default function RecommendationTabs({ activeType, onTypeChange }: Props) {
  return (
    <nav className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto" role="tablist">
      <div className="flex min-w-full sm:min-w-0 gap-1">
        {[
          { key: 'favorites' as const, label: 'Mis Favoritos', icon: Heart },
          { key: 'ai-suggested' as const, label: 'Recomendados para ti', icon: Sparkles },
          { key: 'popular' as const, label: 'Populares', icon: MapPin }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onTypeChange(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              activeType === key
                ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            }`}
            role="tab"
            aria-selected={activeType === key}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}