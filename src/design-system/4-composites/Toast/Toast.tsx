import * as React from 'react';
import { Portal } from '../../2-utilities/Portal';
import { Icon } from '../../3-primitives/Icon';
import { Spinner } from '../../3-primitives/Spinner';
import { cn } from '@/lib/utils';
import styles from './Toast.module.css';

export type ToastKind = 'information' | 'success' | 'warning' | 'danger' | 'loading';
export interface ToastProps {
  children: React.ReactNode;
  kind?: ToastKind;
  action?: React.ReactNode;
  onClose?: () => void;
  closeButton?: boolean;
  closeLabel?: string;
  /** When supplied, the parent owns visibility and receives close requests through onClose. */
  open?: boolean;
  duration?: number;
  className?: string;
}
const restoreTargets = new WeakMap<HTMLElement, HTMLElement>();

/** Only recover focus when a removed notification actually owns it. Background expiry stays neutral. */
function restoreFocusBeforeRemoval(root: HTMLElement | undefined, removing: HTMLElement[] = [], fallback?: HTMLElement | null) {
  if (!root || !root.contains(root.ownerDocument.activeElement)) return;
  const blocked = [root, ...removing];
  const available = (element: HTMLElement | undefined | null): element is HTMLElement => Boolean(element?.isConnected && element !== element.ownerDocument.body && element !== element.ownerDocument.documentElement && !blocked.some(node => node.contains(element)) && !element.closest('[hidden],[inert]') && !element.matches(':disabled') && element.getClientRects().length && element.ownerDocument.defaultView?.getComputedStyle(element).visibility !== 'hidden');
  const preferred = restoreTargets.get(root);
  const candidates = Array.from(root.ownerDocument.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'));
  const next = available(preferred) ? preferred : candidates.find(element => available(element));
  (next ?? (available(fallback) ? fallback : undefined))?.focus({ preventScroll: true });
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(function Toast({ children, kind = 'information', action, onClose, closeButton = true, closeLabel = 'Dismiss notification', open: controlledOpen, duration = 5000, className }, forwardedRef) {
  const [dismissed, setDismissed] = React.useState(false);
  const open = controlledOpen ?? !dismissed;
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const remaining = React.useRef(duration);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  const setRoot = React.useCallback((node: HTMLDivElement | null) => {
    // A stable callback runs on actual removal, including an accepted controlled close.
    if (!node) restoreFocusBeforeRemoval(rootRef.current ?? undefined);
    rootRef.current = node;
    const active = node?.ownerDocument.activeElement;
    if (node && active instanceof HTMLElement && !node.contains(active)) restoreTargets.set(node, active);
  }, []);
  React.useImperativeHandle(forwardedRef, () => rootRef.current!, [open]);
  const close = React.useCallback(() => {
    if (controlledOpen === undefined) {
      restoreFocusBeforeRemoval(rootRef.current ?? undefined);
      setDismissed(true);
    }
    closeRef.current?.();
  }, [controlledOpen]);
  React.useEffect(() => {
    if (open) {
      remaining.current = duration;
      const root = rootRef.current;
      const active = root?.ownerDocument.activeElement;
      if (root && active instanceof HTMLElement && !root.contains(active)) restoreTargets.set(root, active);
    } else { setHovered(false); setFocused(false); }
  }, [open, duration]);
  React.useEffect(() => {
    const listener = () => setHidden(document.hidden);
    listener(); document.addEventListener('visibilitychange', listener);
    return () => document.removeEventListener('visibilitychange', listener);
  }, []);
  React.useEffect(() => {
    if (!open || duration <= 0 || kind === 'loading' || hovered || focused || hidden) return;
    const start = Date.now();
    const timer = setTimeout(close, Math.max(0, remaining.current));
    return () => { clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (Date.now() - start)); };
  }, [open, duration, kind, hovered, focused, hidden, close]);
  if (!open) return null;
  const icons = { information: 'info', success: 'status-check', warning: 'status-warn', danger: 'status-error', loading: 'info' };
  return <div ref={setRoot} data-ink-component="Toast" role={kind === 'danger' ? 'alert' : 'status'} aria-atomic="true" className={cn(styles.toast, styles[kind], className)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={event => { const previous = event.relatedTarget; if (previous instanceof HTMLElement && !event.currentTarget.contains(previous)) restoreTargets.set(event.currentTarget, previous); setFocused(true); }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
    <span className={styles.icon}>{kind === 'loading' ? <Spinner size="small" /> : <Icon name={icons[kind]} size="medium" />}</span>
    <div className={styles.content}>{children}</div>{action && <div className={styles.action}>{action}</div>}
    {closeButton && <button type="button" className={styles.close} onClick={close}><Icon name="close" size="small" /><span className={styles.srOnly}>{closeLabel}</span></button>}
  </div>;
});
export type ToastOptions = Omit<ToastProps, 'open' | 'onClose'>;
interface ToastEntry { id: string; options: ToastOptions; }
interface ToastContextValue { toast: (options: ToastOptions) => string; dismiss: (id: string) => void; }
const ToastContext = React.createContext<ToastContextValue | null>(null);
export interface ToastProviderProps { children: React.ReactNode; limit?: number; position?: 'top-end' | 'bottom-end'; }
export const ToastProvider: React.FC<ToastProviderProps> = ({ children, limit = 3, position = 'bottom-end' }) => {
  const [entries, setEntries] = React.useState<ToastEntry[]>([]);
  const entriesRef = React.useRef<ToastEntry[]>([]);
  const roots = React.useRef(new Map<string, HTMLDivElement>());
  const viewport = React.useRef<HTMLDivElement>(null);
  const count = React.useRef(0);
  const prefix = React.useId();
  const update = React.useCallback((next: ToastEntry[]) => { entriesRef.current = next; setEntries(next); }, []);
  const dismiss = React.useCallback((id: string) => { restoreFocusBeforeRemoval(roots.current.get(id), [], viewport.current); update(entriesRef.current.filter(entry => entry.id !== id)); }, [update]);
  const toast = React.useCallback((options: ToastOptions) => {
    const id = `${prefix}-${++count.current}`;
    const capacity = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 3;
    const next = [...entriesRef.current, { id, options }].slice(-capacity);
    const ids = new Set(next.map(entry => entry.id));
    const removing = entriesRef.current.filter(entry => !ids.has(entry.id)).flatMap(entry => { const root = roots.current.get(entry.id); return root ? [root] : []; });
    removing.forEach(root => restoreFocusBeforeRemoval(root, removing, viewport.current));
    update(next);
    return id;
  }, [prefix, limit, update]);
  return <ToastContext.Provider value={React.useMemo(() => ({ toast, dismiss }), [toast, dismiss])}>{children}<Portal><div ref={viewport} role="region" tabIndex={-1} className={cn(styles.viewport, position === 'top-end' && styles.top)} aria-label="Notifications">{entries.map(entry => <Toast {...entry.options} ref={node => { if (node) roots.current.set(entry.id, node); else roots.current.delete(entry.id); }} key={entry.id} onClose={() => dismiss(entry.id)} />)}</div></Portal></ToastContext.Provider>;
};
export function useToast(): ToastContextValue { const context = React.useContext(ToastContext); if (!context) throw new Error('useToast must be used inside ToastProvider.'); return context; }
Toast.displayName = 'Toast';
