// Date/time helpers. Dates are stored as "YYYY-MM-DD", times as "HH:MM" (server local time).

export const CURRENCY = 'EUR';
export const SLOT_STEP_MINUTES = 30;

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const pad = (n) => String(n).padStart(2, '0');

export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

export const toHHMM = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

export const isValidDateStr = (value) => {
  if (!DATE_REGEX.test(String(value || ''))) return false;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return toDateStr(d) === value;
};

export const isValidTimeStr = (value) => TIME_REGEX.test(String(value || ''));

export const toDateStr = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayStr = () => toDateStr(new Date());

export const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
};

export const dayOfWeek = (dateStr) => new Date(`${dateStr}T00:00:00`).getDay();

export const combineDateTime = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}:00`);

export const PART_OF_DAY = {
  morning: { from: 0, to: 12 * 60, label: 'сутринта' },
  midday: { from: 11 * 60, to: 14 * 60, label: 'по обед' },
  afternoon: { from: 12 * 60, to: 17 * 60 + 30, label: 'следобед' },
  evening: { from: 17 * 60, to: 24 * 60, label: 'вечерта' },
};

export const matchesPartOfDay = (timeStr, partOfDay) => {
  if (!partOfDay || !PART_OF_DAY[partOfDay]) return true;
  const m = toMinutes(timeStr);
  return m >= PART_OF_DAY[partOfDay].from && m < PART_OF_DAY[partOfDay].to;
};

const WEEKDAYS_BG = ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота'];
const MONTHS_BG = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];

export const formatDateBg = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${WEEKDAYS_BG[d.getDay()]}, ${d.getDate()} ${MONTHS_BG[d.getMonth()]}`;
};

export const formatPrice = (value) =>
  new Intl.NumberFormat('bg-BG', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 }).format(Number(value) || 0);

export const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} мин`;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
};
