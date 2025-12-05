import { memo, useCallback, useMemo } from "react";
import type { MouseEvent } from "react";
import { MapPin, Star, Clock, Heart } from "lucide-react";
import type { Place, PlaceFavorite, Review } from "../../types";
import { useUserStore } from "../../store/userStore";
import { useFavorites, type FavoritesState } from "../../store/favoritesStore";
import { getImageSrc, handleImageError } from "../../utils/imageUtils";

type Props = {
  place: Place;
  onInterest?: (p: Place) => void;
  onView?: (p: Place) => void;
};

const PlaceCard = memo(function PlaceCard({ place, onInterest, onView }: Props) {
  const { user } = useUserStore();
  const favorites = useFavorites((state: FavoritesState) => state.favorites);

  // Check if place is favorited - depend on favorites array to trigger re-render
  const isFavorite = useMemo(() => {
    return favorites.some((fav: PlaceFavorite) => fav.place_id === place.id && fav.active);
  }, [favorites, place.id]);

  const averageRating = useMemo(() => {
    return place.reviews && place.reviews.length > 0
      ? place.reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / place.reviews.length
      : null;
  }, [place.reviews]);

  // Memoize event handlers
  const handleFavoriteToggle = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    onInterest?.(place);
  }, [user, onInterest, place]);

  const handleView = useCallback(() => {
    onView?.(place);
  }, [onView, place]);

  const handleMapClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('navigateToMapWithPlace', { 
      detail: { 
        placeId: place.id, 
        displayNumber: place.display_number,
        latitude: place.latitude,
        longitude: place.longitude
      } 
    }));
  }, [place]);

  return (
    <article 
      onClick={handleView}
      className="group relative flex flex-col h-full overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* Image Area */}
      <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        <img
          src={getImageSrc(place.link_image, place.name, 'place')}
          alt={place.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => handleImageError(e, place.name, 'place')}
          loading="lazy"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Map Badge */}
        {place.display_number && (
          <button
            onClick={handleMapClick}
            className="absolute top-3 left-3 w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border border-white/50 dark:border-gray-600 hover:scale-110 transition-all z-10"
            aria-label={`Ver lugar #${place.display_number} en el mapa`}
          >
            {place.display_number}
          </button>
        )}

        {/* Favorite Button */}
        {user && (
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-sm transition-all hover:scale-110 active:scale-95 z-10"
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}`} 
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {place.name}
          </h3>
          {averageRating && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold whitespace-nowrap">
              <Star className="h-3 w-3 fill-current" />
              {averageRating.toFixed(1)}
            </div>
          )}
        </div>

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
          <span className="line-clamp-1">{place.location}</span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 flex-grow">
          {place.description}
        </p>

        {/* Footer Tags */}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {place.category}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            <Clock className="h-3 w-3 mr-1" />
            8AM - 6PM
          </span>
        </div>
      </div>
    </article>
  );
});

PlaceCard.displayName = 'PlaceCard';

export default PlaceCard;
