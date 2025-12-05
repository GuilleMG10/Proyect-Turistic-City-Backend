import { MapPin } from 'lucide-react';

type Props = {
  latitude: number;
  longitude: number;
  label?: string;
  markerColor?: 'blue' | 'red';
};

/**
 * Reusable Google Maps link card component used in modal sidebars
 */
export default function GoogleMapsLink({ 
  latitude, 
  longitude, 
  label = "Ver en Google Maps",
  markerColor = 'blue'
}: Props) {
  const handleClick = () => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const markerColorClasses = {
    blue: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    red: 'bg-red-500/20 text-red-600 dark:text-red-400'
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700/30 p-1 rounded-2xl border border-gray-100 dark:border-gray-700">
      <div 
        className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group cursor-pointer"
        onClick={handleClick}
      >
        {/* Placeholder Map Pattern */}
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center opacity-20 dark:opacity-20 dark:invert" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center animate-pulse ${markerColorClasses[markerColor]}`}>
            <MapPin className="h-6 w-6 drop-shadow-md" />
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs font-medium text-center text-blue-600 dark:text-blue-400 group-hover:underline">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
