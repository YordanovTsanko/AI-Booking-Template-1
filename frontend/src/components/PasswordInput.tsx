import { useState, type ChangeEvent, type FocusEvent } from 'react';

interface PasswordInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  disabled?: boolean;
}

/** Password input with show/hide toggle. */
export default function PasswordInput({ id, name, value, onChange, onBlur, placeholder, error, autoComplete = 'current-password', disabled }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={`input pr-20 ${error ? 'input-error' : ''}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white"
        aria-label={visible ? 'Скрий паролата' : 'Покажи паролата'}
        tabIndex={-1}
      >
        {visible ? 'Скрий' : 'Покажи'}
      </button>
    </div>
  );
}
