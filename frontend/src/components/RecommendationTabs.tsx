import { Heart, Sparkles, MapPin } from "lucide-react";

type RecommendationType = 'favorites' | 'ai-suggested' | 'popular';

type Props = {
  activeType: RecommendationType;
  onTypeChange: (type: RecommendationType) => void;
};

export default function RecommendationTabs({ activeType, onTypeChange }: Props) {
  return (
    <nav className="flex gap-2 overflow-x-auto" role="tablist">
      {[
        { key: 'favorites' as const, label: 'Mis Favoritos', icon: Heart },
        { key: 'ai-suggested' as const, label: 'Recomendados para ti', icon: Sparkles },
        { key: 'popular' as const, label: 'Populares', icon: MapPin }
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onTypeChange(key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeType === key
              ? 'bg-gray-900 text-white'
              : 'bg-white border hover:bg-gray-50'
          }`}
          role="tab"
          aria-selected={activeType === key}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </nav>
  );
}