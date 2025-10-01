import { useState, useEffect } from 'react';

type ViewMode = 'list' | 'card';

export const useViewMode = (key: string, defaultMode: ViewMode = 'list'): [ViewMode, (mode: ViewMode) => void] => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (item as ViewMode) : defaultMode;
    } catch (error) {
      console.error(error);
      return defaultMode;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, viewMode);
    } catch (error) {
      console.error(error);
    }
  }, [viewMode, key]);

  return [viewMode, setViewMode];
};
