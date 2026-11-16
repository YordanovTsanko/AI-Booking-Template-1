import { useState } from 'react';

/** Password input with show/hide toggle. */
export default function PasswordInput({ id, name, value, onChange, onBlur, placeholder, error, autoComplete = 'current-password', disabled }) {
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
        aria-describedby={error ? `${id}-error` : undefined}
        className={`input pr-12 ${error ? 'input-error' : ''}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label={visible ? 'Скрий паролата' : 'Покажи паролата'}
        tabIndex={-1}
      >
        {visible ? 'Скрий' : 'Покажи'}
      </button>
    </div>
  );
}
