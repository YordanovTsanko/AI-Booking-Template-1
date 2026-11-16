import { useMemo, useState } from 'react';
import { MONTHS, WEEKDAYS_SHORT, toDateStr, todayStr, parseDateStr } from '../utils/format.js';

/**
 * Month calendar (Monday first).
 * Props: value (YYYY-MM-DD), onChange(dateStr), isDateDisabled(dateStr) → boolean, maxDaysAhead
 */
export default function Calendar({ value, onChange, isDateDisabled, maxDaysAhead = 90 }) {
  const initial = value ? parseDateStr(value) : new Date();
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const today = todayStr();
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + maxDaysAhead);
    return toDateStr(d);
  }, [maxDaysAhead]);

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const offset = (first.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const list = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d += 1) list.push(toDateStr(new Date(view.year, view.month, d)));
    return list;
  }, [view]);

  const currentMonthStart = toDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const viewMonthStart = toDateStr(new Date(view.year, view.month, 1));
  const canPrev = viewMonthStart > currentMonthStart;
  const canNext = toDateStr(new Date(view.year, view.month + 1, 1)) <= maxDate;

  const shift = (delta) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={!canPrev} className="btn-ghost btn-sm" aria-label="Предишен месец">
          ←
        </button>
        <p className="text-sm font-bold text-slate-800">
          {MONTHS[view.month]} {view.year}
        </p>
        <button type="button" onClick={() => shift(1)} disabled={!canNext} className="btn-ghost btn-sm" aria-label="Следващ месец">
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1" role="grid" aria-label="Календар">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const disabled = date < today || date > maxDate || (isDateDisabled ? isDateDisabled(date) : false);
          const selected = date === value;
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onChange(date)}
              aria-pressed={selected}
              aria-label={date}
              className={`aspect-square rounded-xl text-sm font-medium transition ${
                selected
                  ? 'bg-brand-600 text-white shadow-md'
                  : disabled
                    ? 'cursor-not-allowed text-slate-300 line-through decoration-slate-200'
                    : 'text-slate-700 hover:bg-brand-50 hover:text-brand-700'
              } ${isToday && !selected ? 'ring-1 ring-brand-300' : ''}`}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
