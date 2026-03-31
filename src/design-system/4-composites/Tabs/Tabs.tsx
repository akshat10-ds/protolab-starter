import React, { useState } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs?: TabItem[];
  items?: TabItem[];  // Support both naming conventions
  defaultTab?: string;
  value?: string;  // Support controlled component
  activeTab?: string;  // Support activeTab as alias for value
  onChange?: (tabId: string) => void;
  onTabChange?: (tabId: string) => void;  // Support onTabChange as alias for onChange
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  items,
  defaultTab,
  value,
  activeTab: activeTabProp,
  onChange,
  onTabChange,
  className,
}) => {
  const tabItems = tabs || items || [];
  const controlledValue = value !== undefined ? value : activeTabProp;
  const [activeTab, setActiveTab] = useState(controlledValue || defaultTab || tabItems[0]?.id);
  const handleChange = onChange || onTabChange;

  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (disabled) return;
    setActiveTab(tabId);
    handleChange?.(tabId);
  };

  // Update activeTab when controlled value changes
  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setActiveTab(controlledValue);
    }
  }, [controlledValue]);

  const activeTabContent = tabItems.find(tab => tab.id === activeTab)?.content;

  return (
    <div data-ink-component="Tabs" className={`${styles.wrapper} ${className || ''}`}>
      <div className={styles.tabList} role="tablist">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''} ${
              tab.disabled ? styles.disabled : ''
            }`}
            onClick={() => handleTabClick(tab.id, tab.disabled)}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className={styles.panel}
      >
        {activeTabContent}
      </div>
    </div>
  );
};

Tabs.displayName = 'Tabs';
