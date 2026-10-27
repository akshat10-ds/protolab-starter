import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './DatePicker.module.css';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';
import { Select } from '../../3-primitives/Select';
import { addDays, addMonths, dayValue, formatDate, inDateBounds, nextRange, parseDate, sameDay } from './dateUtils';
import type { DateFormat, DateRange } from './dateUtils';
export type { DateFormat, DateRange } from './dateUtils';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size' | 'defaultValue'> {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  format?: DateFormat;
  error?: boolean;
  helperText?: string;
  label?: string;
  size?: 'small' | 'medium';
  usePicker?: boolean;
  standalone?: boolean;
  mobile?: boolean;
  showMonthYearSelector?: boolean;
  selectionMode?: 'single' | 'range';
  rangeValue?: DateRange;
  onRangeChange?: (range: DateRange) => void;
  formattingInstructions?: string;
  showFormattingInstructions?: boolean;
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value = null, onChange, minDate, maxDate, format = 'MM/DD/YYYY', placeholder = 'Select date',
    disabled = false, readOnly = false, error = false, helperText, label, className, size = 'medium',
    usePicker = true, standalone = false, mobile = false, showMonthYearSelector = false,
    selectionMode = 'single', rangeValue, onRangeChange, formattingInstructions,
    showFormattingInstructions = true, id, 'aria-describedby': describedBy, onKeyDown, onBlur, ...props }, ref) => {
    const generatedId = React.useId(); const inputId = id || generatedId; const calendarId = `${inputId}-calendar`;
    const [isOpen, setIsOpen] = React.useState(false);
    const [internalRange, setInternalRange] = React.useState<DateRange>([null, null]);
    const range = rangeValue ?? internalRange;
    const selectedDate = selectionMode === 'range' ? range[0] : value;
    const initialDate = selectedDate ?? minDate ?? new Date();
    const [currentMonth, setCurrentMonth] = React.useState(initialDate);
    const [focusDate, setFocusDate] = React.useState(initialDate);
    const [draft, setDraft] = React.useState(''); const [typing, setTyping] = React.useState(false); const [invalidDraft, setInvalidDraft] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null); const inputRef = React.useRef<HTMLInputElement>(null);
    const canInteract = !disabled && !readOnly;
    const calendarVisible = standalone || (isOpen && usePicker && canInteract);
    const selectedTimestamp = selectedDate?.getTime();
    React.useEffect(() => { if (selectedDate) { setCurrentMonth(selectedDate); setFocusDate(selectedDate); } }, [selectedTimestamp]);
    React.useEffect(() => { setTyping(false); setInvalidDraft(false); }, [value?.getTime(), range[0]?.getTime(), range[1]?.getTime()]);
    React.useEffect(() => {
      if (!isOpen) return;
      const outside = (event: MouseEvent) => { if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false); };
      document.addEventListener('mousedown', outside); return () => document.removeEventListener('mousedown', outside);
    }, [isOpen]);
    React.useEffect(() => {
      if (!isOpen || standalone) return;
      containerRef.current?.querySelector<HTMLButtonElement>(`button[data-date="${dayValue(focusDate)}"]`)?.focus();
    }, [isOpen, focusDate, standalone]);
    const displayValue = selectionMode === 'range' ? range[0] ? `${formatDate(range[0], format)}${range[1] ? ` – ${formatDate(range[1], format)}` : ''}` : '' : formatDate(value, format);
    const close = (restoreFocus = false) => { setIsOpen(false); if (restoreFocus) inputRef.current?.focus(); };
    const open = () => {
      if (!canInteract || !usePicker) return;
      let next = selectedDate ?? new Date();
      if (minDate && dayValue(next) < dayValue(minDate)) next = minDate;
      if (maxDate && dayValue(next) > dayValue(maxDate)) next = maxDate;
      setFocusDate(next); setCurrentMonth(next); setIsOpen(true);
    };
    const choose = (date: Date) => {
      if (!canInteract || !inDateBounds(date, minDate, maxDate)) return;
      if (selectionMode === 'range') { const next = nextRange(range, date); if (!rangeValue) setInternalRange(next); onRangeChange?.(next); if (next[1] && !standalone) close(true); }
      else { onChange?.(date); if (!standalone) close(true); }
    };
    const commitDraft = () => {
      if (!typing || !canInteract) return;
      if (!draft.trim()) { if (selectionMode === 'range') { if (!rangeValue) setInternalRange([null, null]); onRangeChange?.([null, null]); } else onChange?.(null); setTyping(false); setInvalidDraft(false); return; }
      const segments = selectionMode === 'range' ? draft.split(/\s+[–—]\s+/) : [draft];
      const start = parseDate(segments[0].trim(), format); const end = segments[1] ? parseDate(segments[1].trim(), format) : null;
      const valid = start && inDateBounds(start, minDate, maxDate) && (!segments[1] || (end && inDateBounds(end, minDate, maxDate) && dayValue(end) >= dayValue(start)));
      if (!valid) { setInvalidDraft(true); return; }
      if (selectionMode === 'range') { const next: DateRange = [start, end]; if (!rangeValue) setInternalRange(next); onRangeChange?.(next); } else onChange?.(start);
      setTyping(false); setInvalidDraft(false);
    };
    const moveFocus = (next: Date) => {
      if (minDate && dayValue(next) < dayValue(minDate)) next = minDate;
      if (maxDate && dayValue(next) > dayValue(maxDate)) next = maxDate;
      setFocusDate(next); setCurrentMonth(next);
      if (standalone) requestAnimationFrame(() => containerRef.current?.querySelector<HTMLButtonElement>(`button[data-date="${dayValue(next)}"]`)?.focus());
    };
    const dayKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, date: Date) => {
      let next: Date | undefined;
      switch (event.key) {
        case 'ArrowLeft': next = addDays(date, -1); break; case 'ArrowRight': next = addDays(date, 1); break;
        case 'ArrowUp': next = addDays(date, -7); break; case 'ArrowDown': next = addDays(date, 7); break;
        case 'Home': next = addDays(date, -date.getDay()); break; case 'End': next = addDays(date, 6 - date.getDay()); break;
        case 'PageUp': next = addMonths(date, event.shiftKey ? -12 : -1); break; case 'PageDown': next = addMonths(date, event.shiftKey ? 12 : 1); break;
        case 'Escape': event.preventDefault(); close(true); return;
      }
      if (next) { event.preventDefault(); moveFocus(next); }
    };
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const count = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const rowCount = Math.ceil((startOfMonth.getDay() + count) / 7);
    const focusableDate = sameDay(focusDate, focusDate) && focusDate.getMonth() === currentMonth.getMonth() && focusDate.getFullYear() === currentMonth.getFullYear() && inDateBounds(focusDate, minDate, maxDate)
      ? focusDate
      : Array.from({ length: count }, (_, index) => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), index + 1)).find(date => inDateBounds(date, minDate, maxDate));
    const yearsStart = minDate?.getFullYear() ?? currentMonth.getFullYear() - 100;
    const yearsEnd = maxDate?.getFullYear() ?? currentMonth.getFullYear() + 100;
    const yearOptions = Array.from({ length: Math.max(0, yearsEnd - yearsStart + 1) }, (_, index) => yearsStart + index);
    const formatText = formattingInstructions ?? `(${format})`;
    const descriptions = [describedBy, showFormattingInstructions ? `${inputId}-format` : null, helperText ? `${inputId}-help` : null, invalidDraft ? `${inputId}-invalid` : null].filter(Boolean).join(' ') || undefined;
    return (
      <div data-ink-component="DatePicker" data-ink-prop-size={size} className={cn(styles.wrapper, disabled && styles.disabled, className)} ref={containerRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
        {!standalone && <>
          {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
          <div className={cn(styles.inputWrapper, styles[size], (error || invalidDraft) && styles.error, readOnly && styles.readOnly)}>
            <input {...props} ref={node => { inputRef.current = node; if (typeof ref === 'function') return ref(node); if (ref) ref.current = node; }} id={inputId} type="text" className={styles.input} value={typing ? draft : displayValue} placeholder={placeholder} disabled={disabled} readOnly={readOnly} aria-invalid={error || invalidDraft || undefined} aria-describedby={descriptions} aria-haspopup={usePicker ? 'dialog' : undefined} aria-expanded={usePicker ? isOpen : undefined} aria-controls={isOpen ? calendarId : undefined} onChange={event => { setDraft(event.target.value); setTyping(true); setInvalidDraft(false); }} onKeyDown={event => { onKeyDown?.(event); if (event.defaultPrevented) return; if (event.key === 'ArrowDown' && usePicker) { event.preventDefault(); open(); } else if (event.key === 'Enter' && typing) { event.preventDefault(); commitDraft(); } else if (event.key === 'Escape') { setTyping(false); setInvalidDraft(false); close(); } }} onBlur={event => { commitDraft(); onBlur?.(event); }} />
            {usePicker && <IconButton icon="calendar" size="small" variant="tertiary" aria-label={`Choose ${label || 'date'}`} aria-haspopup="dialog" aria-expanded={isOpen} aria-controls={isOpen ? calendarId : undefined} disabled={!canInteract} onClick={() => isOpen ? close(true) : open()} className={styles.pickerTrigger} />}
          </div>
          {showFormattingInstructions && <div id={`${inputId}-format`} className={styles.helperText}>{formatText}</div>}
          {helperText && <div id={`${inputId}-help`} className={cn(styles.helperText, error && styles.helperTextError)}>{helperText}</div>}
          {invalidDraft && <div id={`${inputId}-invalid`} className={styles.helperTextError}>Enter a valid date in {format} format within the allowed dates.</div>}
        </>}
        {calendarVisible && <div id={calendarId} role={standalone ? 'group' : 'dialog'} aria-label={label ? `${label} calendar` : 'Choose date'} className={cn(styles.calendar, standalone && styles.standalone, mobile && styles.mobile)}>
          <div className={styles.calendarHeader}>
            <IconButton icon="chevron-left" size="small" variant="tertiary" onClick={() => moveFocus(addMonths(focusableDate ?? currentMonth, -1))} aria-label="Previous month" disabled={!canInteract || !!(minDate && dayValue(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0)) < dayValue(minDate))} />
            {showMonthYearSelector ? <div className={styles.selectors}>
              <Select label="Month" hideLabel size={mobile ? 'medium' : 'small'} value={currentMonth.getMonth()} disabled={!canInteract} onChange={event => moveFocus(new Date(currentMonth.getFullYear(), Number(event.target.value), 1))}>{MONTHS.map((month, index) => <option key={month} value={index}>{month.slice(0, 3)}</option>)}</Select>
              <Select label="Year" hideLabel size={mobile ? 'medium' : 'small'} value={currentMonth.getFullYear()} disabled={!canInteract} onChange={event => moveFocus(new Date(Number(event.target.value), currentMonth.getMonth(), 1))}>{yearOptions.map(year => <option key={year} value={year}>{year}</option>)}</Select>
            </div> : <div className={styles.monthYear} aria-live="polite">{MONTHS[currentMonth.getMonth()].slice(0, 3)} {currentMonth.getFullYear()}</div>}
            <IconButton icon="chevron-right" size="small" variant="tertiary" onClick={() => moveFocus(addMonths(focusableDate ?? currentMonth, 1))} aria-label="Next month" disabled={!canInteract || !!(maxDate && dayValue(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)) > dayValue(maxDate))} />
          </div>
          <div role="grid" aria-label={`${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`} aria-multiselectable={selectionMode === 'range' || undefined} className={styles.grid}>
            <div role="row" className={styles.week}>{DAYS.map((day, index) => <div role="columnheader" key={index} className={styles.dayLabel} aria-label={['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][index]}>{day}</div>)}</div>
            {Array.from({ length: rowCount }, (_, week) => <div role="row" className={styles.week} key={week}>{Array.from({ length: 7 }, (_, weekday) => {
              const day = week * 7 + weekday - startOfMonth.getDay() + 1;
              if (day < 1 || day > count) return <div role="gridcell" className={styles.nullDay} key={weekday} />;
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const selected = selectionMode === 'range' ? sameDay(range[0], date) || sameDay(range[1], date) : sameDay(value, date);
              const inRange = selectionMode === 'range' && range[0] && range[1] && dayValue(date) >= dayValue(range[0]) && dayValue(date) <= dayValue(range[1]);
              const isDisabled = !canInteract || !inDateBounds(date, minDate, maxDate);
              return <div role="gridcell" aria-selected={selected || !!inRange} key={weekday} className={cn(styles.cell, inRange && styles.inRange, inRange && sameDay(range[0], date) && styles.rangeStart, inRange && sameDay(range[1], date) && styles.rangeEnd)}><button type="button" data-date={dayValue(date)} className={cn(styles.day, selected && styles.selected, sameDay(new Date(), date) && styles.today)} aria-label={date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} aria-current={sameDay(new Date(), date) ? 'date' : undefined} tabIndex={sameDay(focusableDate, date) ? 0 : -1} disabled={isDisabled} onClick={() => choose(date)} onKeyDown={event => dayKeyDown(event, date)}>{day}</button></div>;
            })}</div>)}
          </div>
        </div>}
      </div>
    );
  }
);
DatePicker.displayName = 'InkDatePicker';
export { DatePicker };
