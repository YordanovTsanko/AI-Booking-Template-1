import type { BookingStatus, DropdownOption, Role } from '../types';

export const CURRENCY = 'EUR';

export const formatPrice = (value: number | string): string =>
  new Intl.NumberFormat('bg-BG', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 }).format(Number(value) || 0);

export const formatDuration = (minutes: number | string): string => {
  const m = Number(minutes) || 0;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (!h) return `${rest} мин`;
  return rest ? `${h} ч ${rest} мин` : `${h} ч`;
};

const pad = (n: number): string => String(n).padStart(2, '0');

export const toDateStr = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayStr = (): string => toDateStr(new Date());

export const parseDateStr = (str: string): Date => new Date(`${str}T00:00:00`);

export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
// Index = JS getDay() (0 = Sunday)
export const WEEKDAYS_BY_INDEX = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
export const WEEKDAYS_SHORT_BY_INDEX = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const MONTHS = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];

export const formatDate = (dateStr: string | undefined, { withWeekday = true }: { withWeekday?: boolean } = {}): string => {
  if (!dateStr) return '';
  const d = parseDateStr(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const base = `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
  return withWeekday ? `${WEEKDAYS_BY_INDEX[d.getDay()]}, ${base}` : base;
};

export const BOOKING_STATUS: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Чакаща', className: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30' },
  confirmed: { label: 'Потвърдена', className: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' },
  completed: { label: 'Завършена', className: 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30' },
  cancelled: { label: 'Отказана', className: 'bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/30' },
};

export const ROLE_LABELS: Record<Role, string> = { admin: 'Администратор', staff: 'Служител', client: 'Клиент' };

export const TIME_OPTIONS: DropdownOption<string>[] = Array.from({ length: 35 }, (_, i) => {
  const minutes = 6 * 60 + i * 30; // 06:00 → 23:00
  const value = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  return { value, label: value };
});

export const partOfDay = (time: string): string => {
  const h = Number(String(time).split(':')[0]);
  if (h < 12) return 'Сутрин';
  if (h < 17) return 'Следобед';
  return 'Вечер';
};

export const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
