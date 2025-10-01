import React from 'react';
import { List, LayoutGrid } from 'lucide-react';

type ViewMode = 'list' | 'card';

interface ViewToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => setViewMode('list')}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'list'
            ? 'bg-white dark:bg-gray-900 text-brand-DEFAULT shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
        }`}
        aria-label="Vue en liste"
      >
        <List className="h-5 w-5" />
      </button>
      <button
        onClick={() => setViewMode('card')}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'card'
            ? 'bg-white dark:bg-gray-900 text-brand-DEFAULT shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
        }`}
        aria-label="Vue en cartes"
      >
        <LayoutGrid className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ViewToggle;
