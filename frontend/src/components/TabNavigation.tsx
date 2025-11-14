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
    <nav className="flex-1 grid grid-cols-6 rounded-lg overflow-hidden border dark:border-gray-700 bg-white dark:bg-gray-800" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`py-2.5 text-sm transition-colors ${
            activeTab === tab.key
              ? "bg-gray-100 dark:bg-gray-700 font-medium text-gray-900 dark:text-white"
              : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
          role="tab"
          aria-selected={activeTab === tab.key}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}