type CategoryChipsProps = {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
};

export default function CategoryChips({
  categories,
  selectedCategory,
  onCategorySelect
}: CategoryChipsProps) {
  return (
    <nav className="flex flex-wrap gap-3" aria-label="Categorías de filtro">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategorySelect(category)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border shadow-sm transition-colors ${
            selectedCategory === category
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white hover:bg-gray-50"
          }`}
        >
          {category}
        </button>
      ))}
    </nav>
  );
}