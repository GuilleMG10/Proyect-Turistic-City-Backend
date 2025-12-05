type LegendItem = {
  label: string;
  count: number;
  color: string;
};

type Props = {
  items: LegendItem[];
};

export default function MapLegend({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg p-4 z-[40] border border-gray-200/50 dark:border-gray-700/50 min-w-[180px]">
      <h4 className="font-bold text-xs uppercase tracking-wider mb-3 text-gray-500 dark:text-gray-400">
        Leyenda
      </h4>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span 
                  className="relative inline-flex rounded-full h-3 w-3"
                  style={{ backgroundColor: item.color }}
                />
              </span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                {item.label}
              </span>
            </div>
            <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
