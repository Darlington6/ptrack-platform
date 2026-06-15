interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex border-b border-gray-200 dark:border-slate-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            active === tab.id
              ? 'border-green-600 text-green-700 dark:text-green-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}