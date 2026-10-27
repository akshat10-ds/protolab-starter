import React, { forwardRef, useEffect, useRef, useState } from 'react';
import styles from './ComboBox.module.css';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';
import { Spinner } from '../../3-primitives/Spinner';

export interface ComboBoxOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
  startElement?: React.ReactNode;
  endElement?: React.ReactNode;
  group?: string;
  /** A parent option navigates to its children without changing the selected value. */
  children?: ComboBoxOption[];
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
  readOnly?: boolean;
  required?: boolean;
  id?: string;
  width?: string;
  className?: string;
  /** Defaults to editable for compatibility. Set false for the published Combobox family. */
  editable?: boolean;
  size?: 'small' | 'medium';
  startElement?: React.ReactNode;
  inputHelp?: React.ReactNode;
  clearable?: boolean;
  showTrigger?: boolean;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  renderOption?: (option: ComboBoxOption) => React.ReactNode;
  'aria-describedby'?: string;
}
function findOption(options: ComboBoxOption[], value: string): ComboBoxOption | undefined {
  for (const option of options) {
    if (option.value === value) return option;
    const child = option.children && findOption(option.children, value);
    if (child) return child;
  }
}
export const ComboBox = forwardRef<HTMLInputElement, ComboBoxProps>(
  ({ label, hideLabel = false, description, error, options, value, onChange,
    placeholder = 'Select an option...', disabled = false, readOnly = false, required = false,
    id, width, className, editable = true, size = 'medium', startElement, inputHelp,
    clearable = true, showTrigger = true, loading = false, loadingText = 'Loading options',
    emptyText = 'No options found', renderOption, 'aria-describedby': describedBy }, ref) => {
    const generatedId = React.useId();
    const comboBoxId = id || generatedId;
    const listboxId = `${comboBoxId}-listbox`;
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [parents, setParents] = useState<ComboBoxOption[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const selectedOption = findOption(options, value);
    const currentOptions = parents.length ? parents[parents.length - 1].children ?? [] : options;
    const filteredOptions = loading ? [] : currentOptions.filter(option => !editable || !isSearching || option.label.toLowerCase().includes(searchTerm.toLowerCase()));
    const enabledIndices = filteredOptions.flatMap((option, index) => option.disabled ? [] : [index]);
    const canInteract = !disabled && !readOnly;
    const showClear = editable && clearable && !!value && canInteract;
    const inputValue = isSearching ? searchTerm : selectedOption?.label ?? '';
    const resetSearch = () => { setSearchTerm(''); setIsSearching(false); setHighlightedIndex(-1); };
    const close = () => { setIsOpen(false); resetSearch(); setParents([]); };
    const open = () => { if (canInteract) setIsOpen(true); };
    useEffect(() => { resetSearch(); }, [value]);
    useEffect(() => { if (!canInteract) close(); }, [canInteract]);
    useEffect(() => {
      if (!isOpen) return;
      const outside = (event: MouseEvent) => { if (!containerRef.current?.contains(event.target as Node)) close(); };
      document.addEventListener('mousedown', outside);
      return () => document.removeEventListener('mousedown', outside);
    }, [isOpen]);
    useEffect(() => {
      if (isOpen && highlightedIndex >= 0) document.getElementById(`${comboBoxId}-option-${highlightedIndex}`)?.scrollIntoView?.({ block: 'nearest' });
    }, [isOpen, highlightedIndex, comboBoxId]);
    const choose = (option: ComboBoxOption) => {
      if (!canInteract || option.disabled) return;
      if (option.children?.length) { setParents([...parents, option]); resetSearch(); return; }
      onChange(option.value); close(); inputRef.current?.focus();
    };
    const move = (direction: 1 | -1) => {
      if (!canInteract) return;
      open();
      if (!enabledIndices.length) { setHighlightedIndex(-1); return; }
      const position = enabledIndices.indexOf(highlightedIndex);
      setHighlightedIndex(enabledIndices[position < 0 ? (direction === 1 ? 0 : enabledIndices.length - 1) : (position + direction + enabledIndices.length) % enabledIndices.length]);
    };
    const keyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!canInteract) return;
      switch (event.key) {
        case 'ArrowDown': event.preventDefault(); move(1); break;
        case 'ArrowUp': event.preventDefault(); move(-1); break;
        case 'Home': if (isOpen) { event.preventDefault(); setHighlightedIndex(enabledIndices[0] ?? -1); } break;
        case 'End': if (isOpen) { event.preventDefault(); setHighlightedIndex(enabledIndices[enabledIndices.length - 1] ?? -1); } break;
        case 'Enter':
        case ' ': if (event.key === ' ' && editable) break; event.preventDefault(); if (isOpen && highlightedIndex >= 0) choose(filteredOptions[highlightedIndex]); else open(); break;
        case 'ArrowRight': if (isOpen && filteredOptions[highlightedIndex]?.children?.length) { event.preventDefault(); choose(filteredOptions[highlightedIndex]); } break;
        case 'ArrowLeft': if (isOpen && parents.length && !editable) { event.preventDefault(); setParents(parents.slice(0, -1)); resetSearch(); } break;
        case 'Escape': if (isOpen) { event.preventDefault(); close(); } break;
        case 'Tab': close(); break;
        default:
          if (!editable && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            open(); const match = filteredOptions.findIndex(option => !option.disabled && option.label.toLowerCase().startsWith(event.key.toLowerCase())); setHighlightedIndex(match);
          }
      }
    };
    const descriptionIds = [describedBy, error ? `${comboBoxId}-error` : description ? `${comboBoxId}-description` : null].filter(Boolean).join(' ') || undefined;
    return (
      <div data-ink-component="ComboBox" data-ink-prop-size={size} data-ink-prop-editable={editable} className={`${styles.wrapper} ${disabled ? styles.wrapperDisabled : ''} ${className ?? ''}`} style={{ width }} ref={containerRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
        <label htmlFor={comboBoxId} className={`${styles.label} ${hideLabel ? styles.visuallyHidden : ''}`}>{label}{required && <span className={styles.required}> *</span>}</label>
        {description && !error && <div id={`${comboBoxId}-description`} className={styles.description}>{description}</div>}
        <div className={styles.fieldRow}>
          <div className={`${styles.inputContainer} ${styles[size]} ${error ? styles.error : ''} ${readOnly ? styles.readOnly : ''}`}>
            {startElement && <span className={styles.startElement}>{startElement}</span>}
            <input ref={node => { inputRef.current = node; if (typeof ref === 'function') return ref(node); if (ref) ref.current = node; }} id={comboBoxId} type="text" role="combobox" aria-autocomplete={editable ? 'list' : 'none'} aria-haspopup="listbox" aria-expanded={isOpen && canInteract} aria-controls={isOpen ? listboxId : undefined} aria-activedescendant={isOpen && filteredOptions[highlightedIndex] ? `${comboBoxId}-option-${highlightedIndex}` : undefined} aria-describedby={descriptionIds} aria-invalid={error ? true : undefined} aria-required={required || undefined} aria-readonly={readOnly || undefined} className={styles.input} value={inputValue} readOnly={!editable || readOnly} onChange={event => { if (canInteract && editable) { setSearchTerm(event.target.value); setIsSearching(true); setHighlightedIndex(-1); open(); } }} onClick={() => isOpen ? close() : open()} onKeyDown={keyDown} placeholder={placeholder} disabled={disabled} autoComplete="off" />
            {showClear ? <IconButton icon="close" size="small" variant="tertiary" onClick={() => { onChange(''); resetSearch(); inputRef.current?.focus(); }} aria-label={`Clear ${label}`} className={styles.clearButton} /> : showTrigger && <IconButton icon="chevron-down" size="small" variant="tertiary" onClick={() => { isOpen ? close() : open(); inputRef.current?.focus(); }} aria-label={`Show ${label} options`} aria-expanded={isOpen && canInteract} aria-controls={isOpen ? listboxId : undefined} disabled={!canInteract} className={styles.triggerButton} />}
            {isOpen && canInteract && <div className={styles.popup}>
              {parents.length > 0 && <button type="button" className={styles.backOption} onMouseDown={event => event.preventDefault()} onClick={() => { setParents(parents.slice(0, -1)); resetSearch(); }}><Icon name="chevron-left" size={20} />Back</button>}
              {loading && <div className={styles.loading} role="status"><Spinner size="small" label={loadingText} /></div>}
              <ul id={listboxId} role="listbox" className={styles.listbox} aria-label={label} aria-busy={loading}>
                {!loading && !filteredOptions.length && <li role="presentation" className={styles.noResults}>{emptyText}</li>}
                {filteredOptions.map((option, index) => <React.Fragment key={option.value}>
                  {option.group && (index === 0 || option.group !== filteredOptions[index - 1].group) && <li role="presentation" className={styles.groupLabel}>{option.group}</li>}
                  <li id={`${comboBoxId}-option-${index}`} role="option" aria-label={option.label} aria-selected={option.value === value} aria-disabled={option.disabled || undefined} aria-describedby={option.description ? `${comboBoxId}-option-${index}-description` : undefined} className={`${styles.option} ${option.value === value ? styles.optionSelected : ''} ${index === highlightedIndex ? styles.optionHighlighted : ''} ${option.disabled ? styles.optionDisabled : ''}`} onMouseDown={event => event.preventDefault()} onClick={() => choose(option)} onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}>
                    {renderOption ? renderOption(option) : <>{option.startElement && <span className={styles.optionElement}>{option.startElement}</span>}<span className={styles.optionText}><span>{option.label}</span>{option.description && <span id={`${comboBoxId}-option-${index}-description`} className={styles.optionDescription}>{option.description}</span>}</span>{option.endElement && <span className={styles.optionElement}>{option.endElement}</span>}{option.children?.length ? <Icon name="chevron-right" size={20} /> : option.value === value && <Icon name="check" size={20} />}</>}
                  </li>
                </React.Fragment>)}
              </ul>
            </div>}
          </div>
          {inputHelp && <span className={styles.inputHelp}>{inputHelp}</span>}
        </div>
        {error && <div id={`${comboBoxId}-error`} className={styles.errorMessage}><Icon name="status-error" size="small" /><span>{error}</span></div>}
      </div>
    );
  }
);
ComboBox.displayName = 'ComboBox';
