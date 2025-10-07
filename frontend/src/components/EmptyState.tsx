import { Heart } from "lucide-react";

type EmptyStateType = 'no-user' | 'no-favorites';

type Props = {
  type: EmptyStateType;
};

export default function EmptyState({ type }: Props) {
  if (type === 'no-user') {
    return (
      <section className="text-center py-12">
        <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          Inicia sesión para ver tus favoritos
        </h2>
        <p className="text-gray-500">
          Guarda lugares y eventos que te interesen para verlos aquí
        </p>
      </section>
    );
  }

  if (type === 'no-favorites') {
    return (
      <section className="text-center py-12">
        <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          Aún no tienes favoritos
        </h3>
        <p className="text-gray-500">
          Explora lugares y eventos, y marca los que te gusten como favoritos
        </p>
      </section>
    );
  }

  return null;
}