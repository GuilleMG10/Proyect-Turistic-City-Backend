import { MapPin, Star, Clock, BadgeDollarSign, Users, Heart } from "lucide-react";
import type { Place } from "../types";
import { useUserStore } from "../store/userStore";
import { getImageSrc, handleImageError } from "../utils/imageUtils";

type Props = {
  place: Place;
  onInterest?: (p: Place) => void;
  onView?: (p: Place) => void;
};

export default function PlaceCard({ place, onInterest, onView }: Props) {
  const { user } = useUserStore();
  
  // Temporary local storage for place favorites until backend implements place_interests
  const getPlaceFavorites = (): number[] => {
    const stored = localStorage.getItem('place-favorites');
    return stored ? JSON.parse(stored) : [];
  };
  
  const setPlaceFavorites = (favorites: number[]) => {
    localStorage.setItem('place-favorites', JSON.stringify(favorites));
  };
  
  // Database fields don't have age/price restrictions for places
  const ages = "Todas las edades";
  const price = "Consultar";

  const placeFavorites = getPlaceFavorites();
  const isFav = user ? placeFavorites.includes(place.id) : false;

  const handleFavoriteToggle = () => {
    if (!user) return;
    
    const favorites = getPlaceFavorites();
    if (isFav) {
      const newFavorites = favorites.filter(id => id !== place.id);
      setPlaceFavorites(newFavorites);
    } else {
      setPlaceFavorites([...favorites, place.id]);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm border">
      {/* imagen */}
      <div className="aspect-[16/10] w-full bg-gray-100 relative">
        <img
          src={getImageSrc(place.link_image, 'place')}
          alt={place.name}
          className="h-full w-full object-cover"
          onError={(e) => handleImageError(e, 'place')}
        />
        {user && (
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
          >
            <Heart className={`h-4 w-4 ${isFav ? 'fill-red-400 text-red-400' : 'text-gray-600'}`} />
          </button>
        )}
      </div>

      {/* contenido */}
      <div className="p-4 space-y-3">
        {/* título + rating */}
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg leading-tight line-clamp-1">{place.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{place.location}</span>
            </p>
          </div>
          {place.reviews && place.reviews.length > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <Star className="h-5 w-5 fill-amber-500" />
              <span className="font-medium">
                {(place.reviews.reduce((sum: number, r) => sum + r.rating, 0) / place.reviews.length).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-700 line-clamp-2">{place.description}</p>

        {/* barras/etiquetas como en el wireframe */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <Clock className="h-3.5 w-3.5" />
            <span>8AM - 6PM</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <BadgeDollarSign className="h-3.5 w-3.5" />
            <span>{price}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <Users className="h-3.5 w-3.5" />
            <span>{ages}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span>{place.category}</span>
          </div>
        </div>

        {/* botones inferiores */}
        <div className="pt-2 flex gap-3">
          <button
            className="flex-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => onInterest?.(place)}
          >
            Me interesa
          </button>
          <button
            className="flex-1 rounded-md bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black"
            onClick={() => onView?.(place)}
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  );
}
