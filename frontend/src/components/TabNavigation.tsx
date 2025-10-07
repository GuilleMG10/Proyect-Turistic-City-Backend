type TabType = 'explorar' | 'eventos' | 'para-ti' | 'calendario';

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
    <nav className="grid grid-cols-4 rounded-lg overflow-hidden border bg-white" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`py-2.5 text-sm transition-colors ${
            activeTab === tab.key
              ? "bg-gray-100 font-medium"
              : "hover:bg-gray-50"
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