import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { DropdownOption, DropdownValue } from '../types';

interface CustomDropdownProps<V extends DropdownValue> {
  options: DropdownOption<V>[];
  value: V | '';
  onChange: (value: V | '', option: DropdownOption<V> | null) => void;
  placeholder?: string;
  label?: string;
  name?: string;
  id?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  error?: string | boolean;
  emptyText?: string;
  className?: string;
  buttonClassName?: string;
  size?: 'md' | 'sm';
  onBlur?: (name?: string) => void;
}

/**
 * Fully custom dropdown – the ONLY dropdown in the project (no native <select>).
 * Search, keyboard navigation (↑ ↓ Enter Esc Home End), outside click, clear, disabled & error states.
 */
export default function CustomDropdown<V extends DropdownValue = string>({
  options,
  value,
  onChange,
  placeholder = 'Избери...',
  label,
  name,
  id,
  searchable = true,
  searchPlaceholder = 'Търси...',
  clearable = false,
  disabled = false,
  error,
  emptyText = 'Няма намерени резултати',
  className = '',
  buttonClassName = '',
  size = 'md',
  onBlur,
}: CustomDropdownProps<V>) {
  const autoId = useId();
  const dropdownId = id || `dropdown-${autoId}`;
  const listId = `${dropdownId}-list`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = useMemo(() => options.find((o) => String(o.value) === String(value)) || null, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.description || ''}`.toLowerCase().includes(q));
  }, [options, query]);

  const close = useCallback(
    (focusButton = false) => {
      setOpen(false);
      setQuery('');
      if (focusButton) buttonRef.current?.focus();
      onBlur?.(name);
    },
    [name, onBlur]
  );

  const openMenu = () => {
    if (disabled) return;
    const idx = filtered.findIndex((o) => String(o.value) === String(value));
    setHighlight(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const selectOption = (option: DropdownOption<V> | undefined) => {
    if (!option || option.disabled) return;
    onChange(option.value, option);
    close(true);
  };

  // Close on outside click / touch
  useEffect(() => {
    if (!open) return undefined;
    const onDocDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('touchstart', onDocDown);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('touchstart', onDocDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (open && searchable) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open, searchable]);

  useEffect(() => {
    if (highlight > filtered.length - 1) setHighlight(Math.max(0, filtered.length - 1));
  }, [filtered.length, highlight]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${highlight}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  useEffect(() => {
    if (disabled && open) close(false);
  }, [disabled, open, close]);

  const moveHighlight = (dir: 1 | -1) => {
    if (!filtered.length) return;
    setHighlight((h) => {
      let next = h;
      for (let i = 0; i < filtered.length; i += 1) {
        next = (next + dir + filtered.length) % filtered.length;
        if (!filtered[next].disabled) break;
      }
      return next;
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openMenu();
        else moveHighlight(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openMenu();
        else moveHighlight(-1);
        break;
      case 'Enter':
        e.preventDefault();
        if (!open) openMenu();
        else selectOption(filtered[highlight]);
        break;
      case ' ':
        if (!open && e.target === buttonRef.current) {
          e.preventDefault();
          openMenu();
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          close(true);
        }
        break;
      case 'Tab':
        if (open) close(false);
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setHighlight(0);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setHighlight(Math.max(0, filtered.length - 1));
        }
        break;
      default:
    }
  };

  const hasError = Boolean(error);
  const sizeClasses = size === 'sm' ? 'px-3 py-2 text-xs rounded-lg' : 'px-3.5 py-2.5 text-sm rounded-xl';

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {label && (
        <label htmlFor={dropdownId} className="label">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          id={dropdownId}
          type="button"
          name={name}
          disabled={disabled}
          onClick={() => (open ? close(false) : openMenu())}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={hasError}
          className={`flex w-full items-center gap-2 border bg-ink-900/80 text-left transition ${sizeClasses} ${
            hasError
              ? 'border-accent-500 focus:ring-4 focus:ring-accent-500/20'
              : open
                ? 'border-brand-500 ring-4 ring-brand-500/20'
                : 'border-white/10 hover:border-white/20'
          } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} focus:outline-hidden ${clearable && selected ? 'pr-16' : 'pr-10'} ${buttonClassName}`}
        >
          <span className={`truncate ${selected ? 'text-slate-100' : 'text-slate-500'}`}>{selected ? selected.label : placeholder}</span>
        </button>
        <svg
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>

        {clearable && selected && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('', null);
              onBlur?.(name);
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Изчисти избора"
            title="Изчисти"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[12rem] animate-fade-in overflow-hidden rounded-xl border border-white/10 bg-ink-700 shadow-2xl shadow-black/60">
          {searchable && (
            <div className="border-b border-white/10 p-2">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
                aria-label={searchPlaceholder}
                aria-controls={listId}
                aria-activedescendant={filtered[highlight] ? `${dropdownId}-opt-${highlight}` : undefined}
              />
            </div>
          )}

          <ul ref={listRef} id={listId} role="listbox" className="thin-scroll max-h-60 overflow-y-auto py-1" aria-labelledby={dropdownId}>
            {filtered.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">{emptyText}</li>}
            {filtered.map((option, index) => {
              const isSelected = String(option.value) === String(value);
              const isHighlighted = index === highlight;
              return (
                <li
                  key={String(option.value)}
                  id={`${dropdownId}-opt-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(option)}
                  className={`mx-1 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${option.disabled ? 'cursor-not-allowed opacity-40' : ''} ${
                    isHighlighted ? 'bg-brand-600/25 text-white' : 'text-slate-300'
                  } ${isSelected ? 'font-semibold' : ''}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.description && <span className="block truncate text-xs text-slate-500">{option.description}</span>}
                  </span>
                  {isSelected && (
                    <svg className="h-4 w-4 shrink-0 text-brand-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {typeof error === 'string' && error && <p className="field-error">{error}</p>}
    </div>
  );
}
