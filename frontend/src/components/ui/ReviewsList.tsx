import type { Review } from '../../types';
import { Star } from 'lucide-react';

type Props = {
  reviews: Review[];
  title?: string;
};

/**
 * Reusable reviews list component used in both Place and Event detail modals
 */
export default function ReviewsList({ reviews, title = "Reseñas" }: Props) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <section>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-400 fill-current" />
        {title}
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
          ({reviews.length})
        </span>
      </h3>
      <div className="grid gap-4">
        {reviews.map((review) => (
          <article key={review.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={review.created_at}>
                {new Date(review.created_at).toLocaleDateString('es-ES')}
              </time>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">"{review.comment}"</p>
          </article>
        ))}
      </div>
    </section>
  );
}
