type TabType = 'explorar' | 'eventos' | 'para-ti' | 'calendario' | 'mapa' | 'itinerario';

type TabConfig = {
  key: TabType;
  label: string;
};

type TabNavigationProps = {
  tabs: TabConfig[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
};

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange
}: TabNavigationProps) {
  return (
    <nav className="flex-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto" role="tablist">
      <div className="flex min-w-full sm:min-w-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            }`}
            role="tab"
            aria-selected={activeTab === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}