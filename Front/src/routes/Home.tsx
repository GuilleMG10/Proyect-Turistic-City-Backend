import { useEffect, useState } from "react";
import type { Place } from "../types";
import PlaceGrid from "../components/PlaceGrid";
import ErrorBanner from "../components/ErrorBanner";

// quitar despues de probar asdasd
const mockPlaces: Place[] = [
  {
    id: "1",
    name: "Cristo de la Concordia",
    description: "Una de las estatuas de Cristo más grandes del mundo, ubicada en el cerro San Pedro con vista panorámica de Cochabamba.",
    image_url: "https://placehold.co/800x533?text=CDLC",
    category: "Turismo",
    min_age: null,
    max_age: null,
    price_min: 0,
    price_max: 10,
    rating: 4.7,
    city: "Cochabamba",
    is_active: true,
  },
  {
    id: "2", 
    name: "Parque Nacional Tunari",
    description: "Área protegida ideal para trekking, observación de fauna y flora, con hermosos paisajes de montaña.",
    image_url: "https://placehold.co/800x533?text=PNT",
    category: "Naturaleza",
    min_age: 8,
    max_age: null,
    price_min: 5,
    price_max: 15,
    rating: 4.5,
    city: "Cochabamba",
    is_active: true,
  },
  {
    id: "3",
    name: "Palacio Portales",
    description: "Impresionante palacio de arquitectura francesa que alberga un museo con arte y objetos históricos.",
    image_url: "https://placehold.co/800x533?text=PP",
    category: "Cultura",
    min_age: null,
    max_age: null,
    price_min: 15,
    price_max: 20,
    rating: 4.2,
    city: "Cochabamba",
    is_active: true,
  },
  {
    id: "4",
    name: "Mercado La Cancha",
    description: "Uno de los mercados más grandes de Sudamérica, perfecto para experimentar la cultura local.",
    image_url: "https://placehold.co/800x533?text=MLC",
    category: "Cultura",
    min_age: null,
    max_age: null,
    price_min: null,
    price_max: null,
    rating: 4.0,
    city: "Cochabamba",
    is_active: true,
  },
  {
    id: "5",
    name: "Teatro Achá",
    description: "Histórico teatro que ofrece una variedad de eventos culturales, obras de teatro y conciertos.",
    image_url: "https://placehold.co/800x533?text=TA",
    category: "Entretenimiento",
    min_age: 12,
    max_age: null,
    price_min: 25,
    price_max: 100,
    rating: 4.3,
    city: "Cochabamba",
    is_active: true,
  },
  {
    id: "6",
    name: "Laguna Alalay",
    description: "Hermosa laguna en el centro de la ciudad, ideal para pasear en familia y disfrutar actividades al aire libre.",
    image_url: "https://placehold.co/800x533?text=LA",
    category: "Naturaleza",
    min_age: null,
    max_age: null,
    price_min: null,
    price_max: null,
    rating: 4.1,
    city: "Cochabamba",
    is_active: true,
  },
];

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      await new Promise(resolve => setTimeout(resolve, 500));
      if (!cancelled) {
        setPlaces(mockPlaces);
      }
      
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

return (
  <section className="space-y-6">
    {err && <ErrorBanner message={err} />}

    {/* Buscar + Filtros */}
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <input
          placeholder="Buscar lugares, eventos, restaurantes..."
          className="w-full rounded-full border px-5 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
      </div>
      <button className="rounded-full border px-4 py-2 bg-white shadow-sm hover:bg-gray-50">
        Filtros
      </button>
    </div>

    {/* Chips de categorías */}
    <div className="flex flex-wrap gap-3">
      {["Todos", "Turismo", "Cultura", "Entretenimiento", "Gastronomía", "Vida Nocturna"].map(
        (c, i) => (
          <button
            key={c}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border shadow-sm ${
              i === 0 ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
            }`}
          >
            {c}
          </button>
        )
      )}
    </div>

    {/* Tabs */}
    <div className="grid grid-cols-4 rounded-lg overflow-hidden border bg-white">
      {["Explorar", "Eventos", "Para ti", "Calendario"].map((t, i) => (
        <button
          key={t}
          className={`py-2.5 text-sm ${
            i === 0 ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
          }`}
        >
          {t}
        </button>
      ))}
    </div>

    {/* Grid de tarjetas */}
    {loading ? (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200/70" />
        ))}
      </div>
    ) : (
      <PlaceGrid
        places={places}
        onInterest={(p) => console.log("Me interesa:", p.name)}
        onView={(p) => console.log("Ver más de:", p.name)}
      />
    )}
  </section>
);
}
