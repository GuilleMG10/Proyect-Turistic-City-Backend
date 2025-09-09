import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Place } from "../types";
import PlaceGrid from "../components/PlaceGrid";
import ErrorBanner from "../components/ErrorBanner";

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("places")
        .select(
          "id,name,description,image_url,category,min_age,max_age,price_min,price_max,rating,city,is_active"
        )
        .eq("is_active", true)
        .limit(30);

      if (error) {
        if (!cancelled) {
          setErr("Error al cargar los lugares");
          setPlaces([]);
        }
        return;
      }
      if (!cancelled) setPlaces((data ?? []) as Place[]);
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
