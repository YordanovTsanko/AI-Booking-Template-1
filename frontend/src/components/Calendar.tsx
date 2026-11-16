import { useMemo, useState } from 'react';
import { MONTHS, WEEKDAYS_SHORT, toDateStr, todayStr, parseDateStr } from '../utils/format';

interface CalendarProps {
  value: string;
  onChange: (date: string) => void;
  isDateDisabled?: (date: string) => boolean;
  maxDaysAhead?: number;
}

/** Month calendar (Monday first). */
export default function Calendar({ value, onChange, isDateDisabled, maxDaysAhead = 90 }: CalendarProps) {
  const initial = value ? parseDateStr(value) : new Date();
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const today = todayStr();
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + maxDaysAhead);
    return toDateStr(d);
  }, [maxDaysAhead]);

  const cells = useMemo<(string | null)[]>(() => {
    const first = new Date(view.year, view.month, 1);
    const offset = (first.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const list: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d += 1) list.push(toDateStr(new Date(view.year, view.month, d)));
    return list;
  }, [view]);

  const now = new Date();
  const currentMonthStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const canPrev = toDateStr(new Date(view.year, view.month, 1)) > currentMonthStart;
  const canNext = toDateStr(new Date(view.year, view.month + 1, 1)) <= maxDate;

  const shift = (delta: number) => {
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
        <p className="font-display text-base font-semibold uppercase tracking-wider text-white">
          {MONTHS[view.month]} {view.year}
        </p>
        <button type="button" onClick={() => shift(1)} disabled={!canNext} className="btn-ghost btn-sm" aria-label="Следващ месец">
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
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
              className={`aspect-square rounded-xl text-sm font-semibold transition ${
                selected
                  ? 'bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-glow'
                  : disabled
                    ? 'cursor-not-allowed text-slate-700'
                    : 'text-slate-200 hover:bg-brand-600/20 hover:text-white'
              } ${isToday && !selected ? 'ring-1 ring-accent-500/70' : ''}`}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
