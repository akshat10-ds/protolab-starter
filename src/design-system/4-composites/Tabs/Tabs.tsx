import React, { useId, useRef, useState } from 'react';
import styles from './Tabs.module.css';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  content?: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  iconOnly?: boolean;
}
export interface TabsProps {
  tabs?: TabItem[];
  items?: TabItem[];
  defaultTab?: string;
  value?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  onTabChange?: (tabId: string) => void;
  fullWidth?: boolean;
  extended?: boolean;
  'aria-label'?: string;
  className?: string;
}
export const Tabs: React.FC<TabsProps> = ({
  tabs, items, defaultTab, value, activeTab: activeTabProp, onChange, onTabChange,
  fullWidth = false, extended = false, 'aria-label': label = 'Tabs', className,
}) => {
  const tabItems = tabs || items || [];
  const controlled = value !== undefined ? value : activeTabProp;
  const [internal, setInternal] = useState(defaultTab || tabItems.find(t => !t.disabled)?.id);
  const active = controlled ?? internal;
  const uid = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const select = (tab: TabItem) => {
    if (tab.disabled) return;
    if (controlled === undefined) setInternal(tab.id);
    (onChange || onTabChange)?.(tab.id);
  };
  const keyDown = (event: React.KeyboardEvent, index: number) => {
    const enabled = tabItems.map((t, i) => t.disabled ? -1 : i).filter(i => i >= 0);
    const at = enabled.indexOf(index);
    let next: number | undefined;
    if (event.key === 'ArrowRight') next = enabled[(at + 1) % enabled.length];
    if (event.key === 'ArrowLeft') next = enabled[(at - 1 + enabled.length) % enabled.length];
    if (event.key === 'Home') next = enabled[0];
    if (event.key === 'End') next = enabled[enabled.length - 1];
    if (next !== undefined) { event.preventDefault(); buttons.current[next]?.focus(); select(tabItems[next]); }
  };
  const activeTab = tabItems.find(tab => tab.id === active);
  return (
    <div data-ink-component="Tabs" className={cn(styles.wrapper, fullWidth && styles.fullWidth, extended && styles.extended, className)}>
      <div className={styles.tabList} role="tablist" aria-label={label}>
        {tabItems.map((tab, index) => (
          <button key={tab.id} type="button" role="tab" ref={node => { buttons.current[index] = node; }}
            aria-selected={active === tab.id} aria-controls={`${uid}-panel-${tab.id}`} id={`${uid}-tab-${tab.id}`}
            tabIndex={active === tab.id || (!activeTab && index === 0) ? 0 : -1}
            className={cn(styles.tab, active === tab.id && styles.active, tab.disabled && styles.disabled)}
            onClick={() => select(tab)} onKeyDown={event => keyDown(event, index)} disabled={tab.disabled}>
            {tab.icon && <span className={styles.affordance}>{tab.icon}</span>}
            <span className={tab.iconOnly ? styles.srOnly : undefined}>{tab.label}</span>
            {tab.badge && <span className={styles.affordance}>{tab.badge}</span>}
          </button>
        ))}
      </div>
      {activeTab && <div role="tabpanel" id={`${uid}-panel-${active}`} aria-labelledby={`${uid}-tab-${active}`} className={styles.panel} tabIndex={0}>
        {activeTab.content}
      </div>}
    </div>
  );
};
Tabs.displayName = 'Tabs';
