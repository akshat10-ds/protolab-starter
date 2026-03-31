import React, { forwardRef, useEffect, useRef, useState } from 'react';
import styles from './ComboBox.module.css';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';

export interface ComboBoxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboBoxProps {
  label: string;
  hideLabel?: boolean;
  description?: string;
  error?: string;
  options: ComboBoxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  width?: string;
}

export const ComboBox = forwardRef<HTMLInputElement, ComboBoxProps>(
  (
    {
      label,
      hideLabel = false,
      description,
      error,
      options,
      value,
      onChange,
      placeholder = 'Select an option...',
      disabled = false,
      required = false,
      id,
      width,
    },
    ref
  ) => {
    const generatedId = React.useId();
    const comboBoxId = id || generatedId;
    const errorId = `${comboBoxId}-error`;
    const descriptionId = `${comboBoxId}-description`;
    const listboxId = `${comboBoxId}-listbox`;

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [inputValue, setInputValue] = useState('');

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);

    // Find selected option label
    const selectedOption = options.find((opt) => opt.value === value);

    // Filter options based on search term
    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Update input value when value prop changes
    useEffect(() => {
      if (selectedOption) {
        setInputValue(selectedOption.label);
        setSearchTerm('');
      } else {
        setInputValue('');
        setSearchTerm('');
      }
    }, [value, selectedOption]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          // Reset input to selected value
          if (selectedOption) {
            setInputValue(selectedOption.label);
            setSearchTerm('');
          } else {
            setInputValue('');
            setSearchTerm('');
          }
          setHighlightedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedOption]);

    // Scroll highlighted option into view
    useEffect(() => {
      if (highlightedIndex >= 0 && listboxRef.current) {
        const highlightedElement = listboxRef.current.children[highlightedIndex] as HTMLElement;
        if (highlightedElement) {
          highlightedElement.scrollIntoView({
            block: 'nearest',
          });
        }
      }
    }, [highlightedIndex]);

    const ariaDescribedBy = [
      error ? errorId : null,
      description ? descriptionId : null,
    ]
      .filter(Boolean)
      .join(' ');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setSearchTerm(newValue);
      setIsOpen(true);
      setHighlightedIndex(-1);
    };

    const handleInputClick = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };

    const handleChevronClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) {
        setIsOpen(!isOpen);
        inputRef.current?.focus();
      }
    };

    const handleOptionClick = (option: ComboBoxOption) => {
      if (!option.disabled) {
        onChange(option.value);
        setInputValue(option.label);
        setSearchTerm('');
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    const handleClear = () => {
      onChange('');
      setInputValue('');
      setSearchTerm('');
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            let nextIndex = highlightedIndex;
            do {
              nextIndex = nextIndex < filteredOptions.length - 1 ? nextIndex + 1 : nextIndex;
            } while (
              nextIndex < filteredOptions.length - 1 &&
              filteredOptions[nextIndex]?.disabled
            );
            setHighlightedIndex(nextIndex);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            let prevIndex = highlightedIndex;
            do {
              prevIndex = prevIndex > 0 ? prevIndex - 1 : -1;
            } while (prevIndex > 0 && filteredOptions[prevIndex]?.disabled);
            setHighlightedIndex(prevIndex);
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleOptionClick(filteredOptions[highlightedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          // Reset input to selected value
          if (selectedOption) {
            setInputValue(selectedOption.label);
            setSearchTerm('');
          } else {
            setInputValue('');
            setSearchTerm('');
          }
          setHighlightedIndex(-1);
          break;

        case 'Tab':
          setIsOpen(false);
          // Reset input to selected value on tab
          if (selectedOption) {
            setInputValue(selectedOption.label);
            setSearchTerm('');
          } else {
            setInputValue('');
            setSearchTerm('');
          }
          setHighlightedIndex(-1);
          break;
      }
    };

    const inputClasses = [
      styles.input,
      error && styles.error,
      disabled && styles.disabled,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div data-ink-component="ComboBox" className={styles.wrapper} style={{ width }} ref={containerRef}>
        <label
          htmlFor={comboBoxId}
          className={`${styles.label} ${hideLabel ? styles.visuallyHidden : ''} ${
            disabled ? styles.labelDisabled : ''
          }`}
        >
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>

        {description && !error && (
          <div id={descriptionId} className={styles.description}>
            {description}
          </div>
        )}

        <div className={styles.inputContainer}>
          <input
            ref={(node) => {
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }}
            id={comboBoxId}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-activedescendant={
              highlightedIndex >= 0
                ? `${comboBoxId}-option-${highlightedIndex}`
                : undefined
            }
            aria-describedby={ariaDescribedBy || undefined}
            aria-invalid={error ? true : undefined}
            aria-required={required || undefined}
            className={inputClasses}
            value={inputValue}
            onChange={handleInputChange}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
          />

          <div className={styles.iconContainer} onClick={handleChevronClick}>
            {value && !disabled && (
              <IconButton
                icon="close"
                size="small"
                variant="tertiary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                aria-label="Clear selection"
                tabIndex={-1}
                className={styles.clearButton}
              />
            )}
            <div
              className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ''}`}
            >
              <Icon name="chevron-down" size="small" />
            </div>
          </div>

          {isOpen && !disabled && (
            <ul
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              className={styles.listbox}
              aria-label={label}
            >
              {filteredOptions.length === 0 ? (
                <li className={styles.noResults}>No options found</li>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li
                      key={option.value}
                      id={`${comboBoxId}-option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                      className={`${styles.option} ${
                        isSelected ? styles.optionSelected : ''
                      } ${isHighlighted ? styles.optionHighlighted : ''} ${
                        option.disabled ? styles.optionDisabled : ''
                      }`}
                      onClick={() => handleOptionClick(option)}
                      onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                    >
                      {option.label}
                      {isSelected && (
                        <span className={styles.checkIcon}>
                          <Icon name="check" size="small" />
                        </span>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        {error && (
          <div id={errorId} className={styles.errorMessage}>
            <span className={styles.errorIcon}>
              <Icon name="status-error" size="small" />
            </span>
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

ComboBox.displayName = 'ComboBox';
