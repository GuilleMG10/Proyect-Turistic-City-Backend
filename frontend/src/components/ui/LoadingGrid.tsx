type LoadingGridProps = {
  count?: number;
  className?: string;
};

export default function LoadingGrid({
  count = 6,
  className = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
}: LoadingGridProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {/* Image skeleton */}
          <div className="aspect-[16/10] w-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          
          {/* Content skeleton */}
          <div className="p-5 space-y-4">
            {/* Title & Location */}
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-1/2 animate-pulse" />
            </div>

            {/* Description lines */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-full animate-pulse" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-5/6 animate-pulse" />
            </div>

            {/* Tags */}
            <div className="flex gap-2 pt-2">
              <div className="h-6 w-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-6 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            </div>

            {/* Button */}
            <div className="pt-2">
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}