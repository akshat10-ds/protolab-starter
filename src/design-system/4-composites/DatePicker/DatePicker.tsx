import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './DatePicker.module.css';
import { Icon } from '@/design-system';
import { IconButton } from '../../3-primitives/IconButton';

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** Selected date value */
  value?: Date | null;
  /** Callback when date changes */
  onChange?: (date: Date | null) => void;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Date format for display */
  format?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input has an error */
  error?: boolean;
  /** Helper text */
  helperText?: string;
  /** Label for the input */
  label?: string;
  /** Custom className */
  className?: string;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value = null,
      onChange,
      minDate,
      maxDate,
      format = 'MM/DD/YYYY',
      placeholder = 'Select date',
      disabled = false,
      error = false,
      helperText,
      label,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [currentMonth, setCurrentMonth] = React.useState(value ? new Date(value) : new Date());
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Close calendar when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const formatDate = (date: Date | null): string => {
      if (!date) return '';

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      switch (format) {
        case 'DD/MM/YYYY':
          return `${day}/${month}/${year}`;
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`;
        case 'MM/DD/YYYY':
        default:
          return `${month}/${day}/${year}`;
      }
    };

    const isDateDisabled = (date: Date): boolean => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    };

    const isSameDay = (date1: Date | null, date2: Date): boolean => {
      if (!date1) return false;
      return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
      );
    };

    const getDaysInMonth = (date: Date): Date[] => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days: Date[] = [];

      // Add empty slots for days before month starts
      for (let i = 0; i < startingDayOfWeek; i++) {
        const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
        days.push(prevMonthDay);
      }

      // Add days of current month
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
      }

      // Add days to fill the last week
      const remainingDays = 7 - (days.length % 7);
      if (remainingDays < 7) {
        for (let i = 1; i <= remainingDays; i++) {
          days.push(new Date(year, month + 1, i));
        }
      }

      return days;
    };

    const handleDateSelect = (date: Date) => {
      if (isDateDisabled(date)) return;
      onChange?.(date);
      setIsOpen(false);
    };

    const handlePrevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleInputClick = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };

    const days = getDaysInMonth(currentMonth);
    const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth.getMonth();

    return (
      <div data-ink-component="DatePicker" className={cn(styles.wrapper, className)}>
        {label && <label className={styles.label}>{label}</label>}
        <div
          ref={containerRef}
          className={cn(styles.container, disabled && styles.disabled, error && styles.error)}
        >
          <div className={styles.inputWrapper} onClick={handleInputClick}>
            <input
              ref={ref}
              type="text"
              className={styles.input}
              value={formatDate(value)}
              placeholder={placeholder}
              disabled={disabled}
              readOnly
              {...props}
            />
            <Icon name="calendar" size="small" className={styles.icon} />
          </div>

          {isOpen && !disabled && (
            <div className={styles.calendar}>
              <div className={styles.calendarHeader}>
                <IconButton
                  icon="chevron-left"
                  size="small"
                  variant="tertiary"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  className={styles.navButton}
                />
                <div className={styles.monthYear}>
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </div>
                <IconButton
                  icon="chevron-right"
                  size="small"
                  variant="tertiary"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  className={styles.navButton}
                />
              </div>

              <div className={styles.daysHeader}>
                {DAYS.map((day) => (
                  <div key={day} className={styles.dayLabel}>
                    {day}
                  </div>
                ))}
              </div>

              <div className={styles.daysGrid}>
                {days.map((date, index) => {
                  const isSelected = isSameDay(value, date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isDisabled = isDateDisabled(date);
                  const isOtherMonth = !isCurrentMonth(date);

                  return (
                    <button
                      key={index}
                      type="button"
                      className={cn(
                        styles.day,
                        isSelected && styles.selected,
                        isToday && styles.today,
                        isDisabled && styles.dayDisabled,
                        isOtherMonth && styles.otherMonth
                      )}
                      onClick={() => handleDateSelect(date)}
                      disabled={isDisabled}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {helperText && (
          <div className={cn(styles.helperText, error && styles.helperTextError)}>{helperText}</div>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'InkDatePicker';

export { DatePicker };
