import { MapPin, Star, Clock, BadgeDollarSign, Users } from "lucide-react";
import type { Place } from "../types";

type Props = {
  place: Place;
  onInterest?: (p: Place) => void;
  onView?: (p: Place) => void;
};

export default function PlaceCard({ place, onInterest, onView }: Props) {
  const ages =
    place.min_age == null && place.max_age == null
      ? "Todas las edades"
      : `${place.min_age ?? 0}+${place.max_age ? ` hasta ${place.max_age}` : ""}`;

  const price =
    place.price_min == null && place.price_max == null
      ? "Gratis / Consultar"
      : place.price_max && place.price_min && place.price_max !== place.price_min
      ? `Bs ${place.price_min} – ${place.price_max}`
      : `Bs ${place.price_min ?? place.price_max}`;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm border">
      {/* imagen */}
      <div className="aspect-[16/10] w-full bg-gray-100">
        <img
          src={
            place.image_url ??
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200"
          }
          alt={place.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* contenido */}
      <div className="p-4 space-y-3">
        {/* título + rating */}
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg leading-tight line-clamp-1">{place.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{place.city ?? "Cochabamba"}</span>
            </p>
          </div>
          {place.rating != null && (
            <div className="flex items-center gap-1 text-amber-600">
              <Star className="h-5 w-5 fill-amber-500" />
              <span className="font-medium">{place.rating.toFixed(1)}</span>
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
