'use client';

type TabType = 'code' | 'design';

interface TabSwitcherProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-1">
      <button
        onClick={() => onTabChange('code')}
        className={`
          px-4 py-2 text-sm font-medium rounded-md transition-all
          ${activeTab === 'code'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-600 hover:text-slate-800'
          }
        `}
      >
        <span className="mr-1.5">📄</span>
        Code View
        <span className="ml-1.5 text-xs text-slate-400">(read-only)</span>
      </button>
      <button
        onClick={() => onTabChange('design')}
        className={`
          px-4 py-2 text-sm font-medium rounded-md transition-all
          ${activeTab === 'design'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-600 hover:text-slate-800'
          }
        `}
      >
        <span className="mr-1.5">✏️</span>
        Design
        <span className="ml-1.5 text-xs text-slate-400">(editable)</span>
      </button>
    </div>
  );
}
