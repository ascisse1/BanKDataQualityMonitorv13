import React, { createContext, useContext, useRef, useCallback, type ReactNode, type KeyboardEvent } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

const useTabs = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>');
  return ctx;
};

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export const Tabs = ({ value, onChange, children, className = '' }: TabsProps) => (
  <TabsContext.Provider value={{ activeTab: value, setActiveTab: onChange }}>
    <div className={className}>{children}</div>
  </TabsContext.Provider>
);

interface TabListProps {
  children: ReactNode;
  label: string;
  className?: string;
}

export const TabList = ({ children, label, className = '' }: TabListProps) => {
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (!tabs || tabs.length === 0) return;

    const tabArray = Array.from(tabs);
    const currentIndex = tabArray.findIndex(tab => tab.getAttribute('aria-selected') === 'true');

    let nextIndex = currentIndex;
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % tabArray.length;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + tabArray.length) % tabArray.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = tabArray.length - 1;
        break;
      default:
        return;
    }

    tabArray[nextIndex].focus();
    tabArray[nextIndex].click();
  }, []);

  return (
    <div
      ref={tabsRef}
      role="tablist"
      aria-label={label}
      className={`border-b border-gray-200 dark:border-surface-700 -mb-px flex space-x-8 ${className}`}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};

interface TabProps {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export const Tab = ({ value, children, icon, className = '' }: TabProps) => {
  const { activeTab, setActiveTab } = useTabs();
  const isSelected = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isSelected}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => setActiveTab(value)}
      className={`
        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ${isSelected
          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
        }
        ${className}
      `}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const TabPanel = ({ value, children, className = '' }: TabPanelProps) => {
  const { activeTab } = useTabs();
  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
};
