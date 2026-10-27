import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './SearchInput.module.css';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';

export interface SearchSuggestion {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'onChange'
> {
  /** Input value */
  value?: string;
  /** Default value for uncontrolled component */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Show loading state */
  loading?: boolean;
  /** Show clear button */
  clearable?: boolean;
  /** Suggestions list */
  suggestions?: SearchSuggestion[];
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Callback when clear is clicked */
  onClear?: () => void;
  /** Callback when suggestion is selected */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  /** Callback when search is submitted */
  onSearch?: (value: string) => void;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Custom search icon */
  searchIcon?: React.ReactNode;
  /** Size variant - small (32px) matches button heights */
  size?: 'small' | 'medium';
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      defaultValue,
      placeholder = 'Search...',
      loading = false,
      clearable = true,
      suggestions = [],
      onChange,
      onClear,
      onSuggestionSelect,
      onSearch,
      debounceMs = 0,
      disabled = false,
      className,
      searchIcon,
      size = 'medium',
      onFocus,
      onBlur,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(value ?? defaultValue ?? '');
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(-1);
    const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const isControlled = value !== undefined;
    const currentValue = debounceMs > 0 ? internalValue : (isControlled ? value : internalValue);
    const listId = React.useId();
    const suggestionsVisible = !disabled && showSuggestions && suggestions.length > 0;

    React.useEffect(() => {
      if (value !== undefined) setInternalValue(value);
    }, [value]);
    React.useEffect(() => () => clearTimeout(debounceTimer.current), []);
    React.useEffect(() => {
      setSelectedIndex(-1);
    }, [suggestions]);

    // Click outside to close suggestions
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      setInternalValue(newValue);

      if (debounceMs > 0) {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
          onChange?.(newValue);
        }, debounceMs);
      } else {
        onChange?.(newValue);
      }

      setShowSuggestions(true);
      setSelectedIndex(-1);
    };

    const handleClear = () => {
      clearTimeout(debounceTimer.current);
      setInternalValue('');
      onChange?.('');
      onClear?.();
      setShowSuggestions(false);
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
      clearTimeout(debounceTimer.current);
      setInternalValue(suggestion.label);
      onChange?.(suggestion.label);
      onSuggestionSelect?.(suggestion);
      setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      if (suggestions.length === 0) {
        if (e.key === 'Enter' && onSearch) {
          e.preventDefault();
          onSearch(currentValue);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setShowSuggestions(true);
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestionsVisible && selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSuggestionClick(suggestions[selectedIndex]);
          } else if (onSearch) {
            onSearch(currentValue);
            setShowSuggestions(false);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    };

    const defaultSearchIcon = <Icon name="search" size="small" />;

    return (
      <div data-ink-component="SearchInput" data-ink-prop-size={size} ref={containerRef} className={cn(styles.container, className)}>
        <div className={cn(styles.inputWrapper, styles[size], disabled && styles.disabled)}>
          <span className={styles.searchIcon}>{searchIcon || defaultSearchIcon}</span>
          <input
            {...props}
            ref={ref}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={suggestionsVisible}
            aria-controls={suggestionsVisible ? listId : undefined}
            aria-activedescendant={suggestionsVisible && selectedIndex >= 0 ? `${listId}-${selectedIndex}` : undefined}
            className={styles.input}
            value={currentValue}
            placeholder={placeholder}
            disabled={disabled}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={event => { onFocus?.(event); if (!event.defaultPrevented) setShowSuggestions(true); }}
            onBlur={event => {
              onBlur?.(event);
              if (!containerRef.current?.contains(event.relatedTarget)) setShowSuggestions(false);
            }}
          />
          {loading && (
            <span className={styles.loadingIcon}>
              <svg className={styles.spinner} viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.25"
                />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
          )}
          {clearable && currentValue && !loading && (
            <IconButton
              icon="close"
              size="small"
              variant="tertiary"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Clear search"
              className={styles.clearButton}
            />
          )}
        </div>

        {suggestionsVisible && (
          <ul id={listId} role="listbox" className={styles.suggestions}>
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                onMouseDown={event => event.preventDefault()}
                className={cn(styles.suggestion, index === selectedIndex && styles.selected)}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {suggestion.icon && (
                  <span className={styles.suggestionIcon}>{suggestion.icon}</span>
                )}
                <div className={styles.suggestionContent}>
                  <span className={styles.suggestionLabel}>{suggestion.label}</span>
                  {suggestion.description && (
                    <span className={styles.suggestionDescription}>{suggestion.description}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'InkSearchInput';

export { SearchInput };
