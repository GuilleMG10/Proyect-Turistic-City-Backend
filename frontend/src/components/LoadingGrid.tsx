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
        <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200/70" />
      ))}
    </div>
  );
}