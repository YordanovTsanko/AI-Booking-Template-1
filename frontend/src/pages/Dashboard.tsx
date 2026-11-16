import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorFeedback, getFieldErrors } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import CustomDropdown from '../components/CustomDropdown';
import InlineFeedback from '../components/InlineFeedback';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import PageHeader from '../components/PageHeader';
import { SkeletonList, SkeletonStats } from '../components/Skeleton';
import { BOOKING_STATUS, formatDate, formatDuration, formatPrice, todayStr, ROLE_LABELS, MONTHS } from '../utils/format';
import { BARBER_IMAGES } from '../utils/images';
import {
  refId,
  type ApiResponse,
  type Availability,
  type Booking,
  type BookingStatus,
  type DropdownOption,
  type Feedback,
  type FieldErrors,
  type PaginationMeta,
  type Role,
  type Service,
  type StaffMember,
  type Stats,
} from '../types';

const STATUS_FILTER: DropdownOption<BookingStatus>[] = [
  { value: 'pending', label: 'Чакащи' },
  { value: 'confirmed', label: 'Потвърдени' },
  { value: 'completed', label: 'Завършени' },
  { value: 'cancelled', label: 'Отказани' },
];

type Scope = 'all' | 'upcoming' | 'past';
const SCOPE_OPTIONS: DropdownOption<Scope>[] = [
  { value: 'all', label: 'Всички дати' },
  { value: 'upcoming', label: 'Предстоящи' },
  { value: 'past', label: 'Минали' },
];

const EMPTY_META: Pick<PaginationMeta, 'totalPages' | 'total'> = { totalPages: 1, total: 0 };

const isFuture = (b: Booking): boolean => new Date(b.startAt) > new Date();

/* ------------------------------------------------------------------ */
interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: string;
  tone?: 'blue' | 'red' | 'green' | 'white';
}

const TONES: Record<NonNullable<StatCardProps['tone']>, string> = {
  blue: 'from-brand-600/30 text-brand-300',
  red: 'from-accent-600/30 text-accent-300',
  green: 'from-emerald-600/30 text-emerald-300',
  white: 'from-white/15 text-slate-200',
};

function StatCard({ label, value, hint, icon, tone = 'blue' }: StatCardProps) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-linear-to-br to-transparent ${TONES[tone]}`} aria-hidden="true" />
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span aria-hidden="true">{icon}</span> {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const s = BOOKING_STATUS[status];
  return <span className={`badge ${s.className}`}>{s.label}</span>;
}

/* ------------------------------------------------------------------ */
interface RowAction {
  key: string;
  label: string;
  className: string;
  onClick: () => void;
}

interface BookingRowProps {
  booking: Booking;
  role: Role;
  busyId: string | null;
  onStatus: (booking: Booking, status: BookingStatus, needsConfirm?: boolean) => void;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
}

function BookingRow({ booking, role, onStatus, onEdit, onDelete, busyId }: BookingRowProps) {
  const busy = busyId === booking._id;
  const future = isFuture(booking);
  const active = booking.status === 'pending' || booking.status === 'confirmed';
  const actions: RowAction[] = [];
  const cancelCls = 'btn-secondary btn-sm text-accent-400 hover:text-accent-300';

  if (role === 'client') {
    if (active && future) actions.push({ key: 'cancel', label: 'Откажи', className: cancelCls, onClick: () => onStatus(booking, 'cancelled', true) });
  } else {
    if (booking.status === 'pending') actions.push({ key: 'confirm', label: 'Потвърди', className: 'btn-success btn-sm', onClick: () => onStatus(booking, 'confirmed') });
    if (active && !future) actions.push({ key: 'complete', label: 'Завърши', className: 'btn-primary btn-sm', onClick: () => onStatus(booking, 'completed') });
    if (active) actions.push({ key: 'cancel', label: 'Откажи', className: cancelCls, onClick: () => onStatus(booking, 'cancelled', true) });
    if (role === 'admin' && booking.status === 'cancelled' && future) {
      actions.push({ key: 'restore', label: 'Възстанови', className: 'btn-secondary btn-sm', onClick: () => onStatus(booking, 'pending') });
    }
    if (role === 'admin') {
      actions.push({ key: 'edit', label: 'Редактирай', className: 'btn-secondary btn-sm', onClick: () => onEdit(booking) });
      actions.push({ key: 'delete', label: 'Изтрий', className: 'btn-ghost btn-sm text-accent-400 hover:bg-accent-500/10', onClick: () => onDelete(booking) });
    }
  }

  const monthShort = MONTHS[Number(booking.date?.slice(5, 7)) - 1]?.slice(0, 3) || '';
  const serviceTitle = typeof booking.service === 'object' ? booking.service.title : booking.serviceTitle;
  const staffName = typeof booking.staff === 'object' ? booking.staff.name : booking.staffName;

  return (
    <article className={`card flex flex-col gap-4 p-4 transition hover:border-white/20 sm:flex-row sm:items-center ${busy ? 'opacity-60' : ''}`}>
      <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ring-1 ${future ? 'bg-brand-600/15 text-brand-300 ring-brand-500/30' : 'bg-white/5 text-slate-400 ring-white/10'}`}>
        <span className="font-display text-xl font-bold leading-none">{booking.date?.slice(8)}</span>
        <span className="text-[10px] font-semibold uppercase">{monthShort}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-white">{serviceTitle || booking.serviceTitle}</h3>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-0.5 text-sm text-slate-400">
          {formatDate(booking.date)} · {booking.time}–{booking.endTime} · {formatDuration(booking.duration)} · <span className="text-accent-400">{formatPrice(booking.price)}</span>
        </p>
        <p className="mt-0.5 text-sm text-slate-400">
          {role !== 'staff' && <>💈 {staffName || booking.staffName}</>}
          {role !== 'client' && (
            <>
              {role !== 'staff' && ' · '}🙋 {booking.clientName}
              {booking.clientPhone && <span className="text-slate-500"> ({booking.clientPhone})</span>}
            </>
          )}
        </p>
        {booking.notes && <p className="mt-1 line-clamp-2 text-xs italic text-slate-500">„{booking.notes}“</p>}
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {actions.map((a) => (
            <button key={a.key} type="button" onClick={a.onClick} disabled={busy} className={a.className}>
              {busy && a.key !== 'edit' && a.key !== 'delete' ? 'Зарежда...' : a.label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
interface BookingForm {
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
  status: BookingStatus;
}

const EMPTY_FORM: BookingForm = { serviceId: '', staffId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '', notes: '', status: 'confirmed' };

interface BookingFormModalProps {
  open: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

function BookingFormModal({ open, booking, onClose, onSaved }: BookingFormModalProps) {
  const isEdit = Boolean(booking);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsMsg, setSlotsMsg] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFeedback(null);
    setForm(
      booking
        ? {
            serviceId: refId(booking.service),
            staffId: refId(booking.staff),
            date: booking.date,
            time: booking.time,
            clientName: booking.clientName || '',
            clientPhone: booking.clientPhone || '',
            clientEmail: booking.clientEmail || '',
            notes: booking.notes || '',
            status: booking.status,
          }
        : EMPTY_FORM
    );
    api
      .get<ApiResponse<Service[]>>('/services', { params: { limit: 100, sort: 'title_asc' } })
      .then((res) => setServices(res.data.data || []))
      .catch((err: unknown) => setFeedback({ type: 'error', message: getErrorFeedback(err).message }));
  }, [open, booking]);

  useEffect(() => {
    if (!open || !form.serviceId) {
      setStaff([]);
      return;
    }
    api
      .get<ApiResponse<StaffMember[]>>('/staff', { params: { serviceId: form.serviceId } })
      .then((res) => setStaff(res.data.data || []))
      .catch((err: unknown) => setFeedback({ type: 'error', message: getErrorFeedback(err).message }));
  }, [open, form.serviceId]);

  useEffect(() => {
    if (!open || !form.serviceId || !form.staffId || !form.date) {
      setSlots([]);
      setSlotsMsg('');
      return undefined;
    }
    let cancelled = false;
    setSlotsLoading(true);
    api
      .get<ApiResponse<Availability>>('/bookings/availability', {
        params: { serviceId: form.serviceId, staffId: form.staffId, date: form.date, excludeId: booking?._id },
      })
      .then((res) => {
        if (cancelled) return;
        let list = res.data.data?.slots || [];
        // Keep the current time selectable when editing without schedule changes
        if (booking && form.date === booking.date && form.staffId === refId(booking.staff) && !list.includes(booking.time)) {
          list = [...list, booking.time].sort();
        }
        setSlots(list);
        setSlotsMsg(list.length ? '' : res.data.message);
      })
      .catch((err: unknown) => {
        if (!cancelled) setSlotsMsg(getErrorFeedback(err).message);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, form.serviceId, form.staffId, form.date, booking]);

  const set = <K extends keyof BookingForm>(name: K, value: BookingForm[K]) => {
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === 'serviceId') {
        next.staffId = '';
        next.time = '';
      }
      if (name === 'staffId' || name === 'date') next.time = '';
      return next;
    });
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!form.serviceId) e.serviceId = 'Избери услуга';
    if (!form.staffId) e.staffId = 'Избери служител';
    if (!form.date) e.date = 'Избери дата';
    if (!form.time) e.time = 'Избери час';
    if (!isEdit && form.clientName.trim().length < 2) e.clientName = 'Въведи име на клиента (поне 2 символа)';
    if (form.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.clientEmail.trim())) e.clientEmail = 'Въведи валиден имейл адрес';
    return e;
  };

  const handleSubmit = async (ev?: FormEvent) => {
    ev?.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setFeedback({ type: 'error', message: 'Моля, попълни правилно отбелязаните полета.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    const payload: Record<string, string | undefined> = {
      serviceId: form.serviceId,
      staffId: form.staffId,
      date: form.date,
      time: form.time,
      notes: form.notes.trim(),
      status: form.status,
    };
    const isWalkIn = !booking || !booking.client;
    if (isWalkIn) {
      payload.clientName = form.clientName.trim() || undefined;
      payload.clientPhone = form.clientPhone.trim() || undefined;
      payload.clientEmail = form.clientEmail.trim() || undefined;
    }
    try {
      const res = booking ? await api.put<ApiResponse<Booking>>(`/bookings/${booking._id}`, payload) : await api.post<ApiResponse<Booking>>('/bookings', payload);
      onSaved(res.data.message);
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors });
      setErrors(getFieldErrors(fb.errors));
    } finally {
      setSaving(false);
    }
  };

  const statusOptions: DropdownOption<BookingStatus>[] = isEdit
    ? (Object.keys(BOOKING_STATUS) as BookingStatus[]).map((value) => ({ value, label: BOOKING_STATUS[value].label }))
    : [
        { value: 'confirmed', label: 'Потвърдена' },
        { value: 'pending', label: 'Чакаща' },
      ];

  const clientEditable = !booking || !booking.client;

  return (
    <Modal
      open={open}
      title={isEdit ? 'Редактирай резервация' : 'Нова резервация'}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Отказ
          </button>
          <button type="button" className="btn-primary" onClick={() => handleSubmit()} disabled={saving}>
            {saving ? 'Зарежда...' : isEdit ? 'Запази промените' : 'Създай резервация'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <InlineFeedback type={feedback?.type} message={feedback?.message} errors={feedback?.errors} onClose={() => setFeedback(null)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <CustomDropdown
            label="Услуга"
            options={services.map((s) => ({ value: s._id, label: s.title, description: `${formatPrice(s.price)} · ${formatDuration(s.duration)}` }))}
            value={form.serviceId}
            onChange={(v) => set('serviceId', v)}
            placeholder="Избери услуга"
            error={errors.serviceId}
          />
          <CustomDropdown
            label="Служител"
            options={staff.map((s) => ({ value: s._id, label: s.name, description: s.position || undefined }))}
            value={form.staffId}
            onChange={(v) => set('staffId', v)}
            placeholder={form.serviceId ? (staff.length ? 'Избери служител' : 'Няма служители') : 'Първо избери услуга'}
            disabled={!form.serviceId || staff.length === 0}
            error={errors.staffId}
          />
          <div>
            <label htmlFor="bf-date" className="label">
              Дата
            </label>
            <input id="bf-date" type="date" min={isEdit ? undefined : todayStr()} value={form.date} onChange={(e) => set('date', e.target.value)} className={`input ${errors.date ? 'input-error' : ''}`} />
            {errors.date && <p className="field-error">{errors.date}</p>}
          </div>
          <div>
            <CustomDropdown
              label="Час"
              options={slots.map((t) => ({ value: t, label: t }))}
              value={form.time}
              onChange={(v) => set('time', v)}
              placeholder={slotsLoading ? 'Зарежда...' : form.date ? (slots.length ? 'Избери час' : 'Няма свободни часове') : 'Първо избери дата'}
              disabled={slotsLoading || !slots.length}
              error={errors.time}
            />
            {slotsMsg && !errors.time && <p className="mt-1.5 text-xs text-amber-400">{slotsMsg}</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">Клиент</p>
          {clientEditable ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="bf-name" className="label">
                  Име
                </label>
                <input id="bf-name" value={form.clientName} onChange={(e) => set('clientName', e.target.value)} className={`input ${errors.clientName ? 'input-error' : ''}`} placeholder="Иван Иванов" maxLength={60} />
                {errors.clientName && <p className="field-error">{errors.clientName}</p>}
              </div>
              <div>
                <label htmlFor="bf-phone" className="label">
                  Телефон
                </label>
                <input id="bf-phone" value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} className={`input ${errors.clientPhone ? 'input-error' : ''}`} placeholder="+359..." />
                {errors.clientPhone && <p className="field-error">{errors.clientPhone}</p>}
              </div>
              <div>
                <label htmlFor="bf-email" className="label">
                  Имейл
                </label>
                <input id="bf-email" type="email" value={form.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} className={`input ${errors.clientEmail ? 'input-error' : ''}`} placeholder="по желание" />
                {errors.clientEmail && <p className="field-error">{errors.clientEmail}</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              {booking?.clientName} · {booking?.clientEmail} {booking?.clientPhone && `· ${booking.clientPhone}`}
              <span className="mt-1 block text-xs text-slate-500">Регистриран клиент – данните се управляват от самия него.</span>
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <div>
            <label htmlFor="bf-notes" className="label">
              Бележка
            </label>
            <textarea id="bf-notes" rows={2} maxLength={500} value={form.notes} onChange={(e) => set('notes', e.target.value)} className={`input resize-none ${errors.notes ? 'input-error' : ''}`} />
            {errors.notes && <p className="field-error">{errors.notes}</p>}
          </div>
          <CustomDropdown label="Статус" options={statusOptions} value={form.status} onChange={(v) => set('status', v || 'confirmed')} searchable={false} error={errors.status} />
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
interface ConfirmState {
  type: 'cancel' | 'delete';
  booking: Booking;
}

export default function Dashboard() {
  const { user } = useAuth();
  const role: Role = user?.role || 'client';
  const isManager = role === 'admin' || role === 'staff';

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(isManager);
  const [statsError, setStatsError] = useState('');

  const [items, setItems] = useState<Booking[]>([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [scope, setScope] = useState<Scope>('upcoming');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const debouncedSearch = useDebounce(search, 400);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmError, setConfirmError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);

  const refresh = useCallback(() => setReload((r) => r + 1), []);

  useEffect(() => {
    if (!isManager) return;
    setStatsLoading(true);
    setStatsError('');
    api
      .get<ApiResponse<Stats>>('/bookings/stats')
      .then((res) => setStats(res.data.data))
      .catch((err: unknown) => setStatsError(getErrorFeedback(err).message))
      .finally(() => setStatsLoading(false));
  }, [isManager, reload]);

  useEffect(() => setPage(1), [debouncedSearch, status, scope]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setListError('');
    api
      .get<ApiResponse<Booking[]>>('/bookings', {
        params: { page, limit: 8, search: debouncedSearch || undefined, status: status || undefined, scope: scope === 'all' ? undefined : scope },
      })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.data || []);
        setMeta(res.data.meta || EMPTY_META);
      })
      .catch((err: unknown) => {
        if (!cancelled) setListError(getErrorFeedback(err).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, status, scope, reload]);

  /** Returns true on success, or the error message. */
  const changeStatus = async (booking: Booking, nextStatus: BookingStatus): Promise<true | string> => {
    setBusyId(booking._id);
    setFeedback(null);
    try {
      const res = await api.patch<ApiResponse<Booking>>(`/bookings/${booking._id}/status`, { status: nextStatus });
      setFeedback({ type: 'success', message: res.data.message });
      refresh();
      return true;
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors });
      return fb.message;
    } finally {
      setBusyId(null);
    }
  };

  const handleStatus = (booking: Booking, nextStatus: BookingStatus, needsConfirm = false) => {
    if (needsConfirm) {
      setConfirmError('');
      setConfirm({ type: 'cancel', booking });
      return;
    }
    void changeStatus(booking, nextStatus);
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    setConfirmError('');
    if (confirm.type === 'cancel') {
      const result = await changeStatus(confirm.booking, 'cancelled');
      setConfirmLoading(false);
      if (result === true) setConfirm(null);
      else setConfirmError(result);
      return;
    }
    try {
      const res = await api.delete<ApiResponse<{ _id: string }>>(`/bookings/${confirm.booking._id}`);
      setFeedback({ type: 'success', message: res.data.message });
      setConfirm(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      refresh();
    } catch (err) {
      setConfirmError(getErrorFeedback(err).message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const onSaved = (message: string) => {
    setFormOpen(false);
    setEditing(null);
    setFeedback({ type: 'success', message });
    refresh();
  };

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
  }, []);

  const closeConfirm = useCallback(() => {
    if (!confirmLoading) setConfirm(null);
  }, [confirmLoading]);

  const hasFilters = Boolean(search || status || scope !== 'upcoming');

  const statCards = useMemo<StatCardProps[]>(() => {
    if (!stats) return [];
    return [
      { label: 'Предстоящи', value: stats.upcomingCount, hint: `${stats.pendingCount} чакат потвърждение`, icon: '📅', tone: 'blue' },
      { label: 'Приходи', value: formatPrice(stats.revenue), hint: `${formatPrice(stats.revenueThisMonth)} този месец`, icon: '💶', tone: 'red' },
      { label: 'Очаквани приходи', value: formatPrice(stats.expectedRevenue), hint: 'от предстоящите часове', icon: '📈', tone: 'green' },
      { label: 'Клиенти', value: stats.totalClients, hint: `${stats.totalBookings} резервации общо`, icon: '👥', tone: 'white' },
    ];
  }, [stats]);

  const greeting = role === 'admin' ? 'Ето как върви бизнесът днес.' : role === 'staff' ? 'Ето твоите часове.' : 'Тук са всички твои резервации.';

  return (
    <div>
      <PageHeader
        eyebrow={ROLE_LABELS[role]}
        title={`Здравей, ${user?.name?.split(' ')[0] || ''}`}
        subtitle={greeting}
        image={BARBER_IMAGES.interior}
        actions={
          role === 'admin' ? (
            <>
              <Link to="/admin/services" className="btn-secondary">
                Услуги и екип
              </Link>
              <button type="button" onClick={openCreate} className="btn-accent">
                + Нова резервация
              </button>
            </>
          ) : (
            <Link to="/booking" className="btn-accent">
              + Нова резервация
            </Link>
          )
        }
      />

      <div className="container-page">
        {isManager && (
          <section className="relative z-10 -mt-8" aria-label="Статистика">
            {statsLoading && !stats && <SkeletonStats />}
            {statsError && <InlineFeedback type="error" message={statsError} />}
            {stats && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((c) => (
                  <StatCard key={c.label} {...c} />
                ))}
              </div>
            )}

            {stats && (
              <div className="card mt-6 p-5">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white">Следващи часове</h2>
                {stats.upcoming.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">Няма предстоящи часове. Време е за малко почивка ☕</p>
                ) : (
                  <ul className="mt-3 divide-y divide-white/10">
                    {stats.upcoming.map((b) => (
                      <li key={b._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                        <span className="font-semibold text-white">
                          {formatDate(b.date)} · <span className="text-brand-400">{b.time}</span>
                        </span>
                        <span className="text-slate-400">
                          {b.serviceTitle} · {b.clientName} {role === 'admin' && `· ${b.staffName}`}
                        </span>
                        <StatusBadge status={b.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        )}

        <section className={isManager ? 'mt-10' : 'relative z-10 -mt-8'} aria-labelledby="bookings-title">
          {isManager && (
            <h2 id="bookings-title" className="font-display text-2xl font-semibold uppercase tracking-wide text-white">
              Резервации
            </h2>
          )}

          <div className={`card grid gap-3 p-4 md:grid-cols-[1fr_200px_200px] ${isManager ? 'mt-4' : ''}`}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={role === 'client' ? 'Търси по услуга или служител...' : 'Търси по клиент, телефон, услуга...'}
              className="input"
              aria-label="Търси резервации"
            />
            <CustomDropdown options={STATUS_FILTER} value={status} onChange={(v) => setStatus(v)} placeholder="Всички статуси" clearable searchable={false} />
            <CustomDropdown options={SCOPE_OPTIONS} value={scope} onChange={(v) => setScope(v || 'all')} searchable={false} />
          </div>

          {feedback && <InlineFeedback type={feedback.type} message={feedback.message} errors={feedback.errors} onClose={() => setFeedback(null)} className="mt-4" />}

          <div className="mt-4">
            {loading && <SkeletonList count={4} />}
            {!loading && listError && (
              <InlineFeedback type="error" message={listError}>
                <button type="button" onClick={refresh} className="mt-2 text-sm font-semibold underline">
                  Опитай отново
                </button>
              </InlineFeedback>
            )}
            {!loading && !listError && items.length === 0 && (
              <EmptyState
                description={hasFilters ? 'Няма резервации по тези критерии.' : 'Тук ще се появят резервациите.'}
                actionLabel={hasFilters ? 'Изчисти филтрите' : 'Запази час'}
                onAction={
                  hasFilters
                    ? () => {
                        setSearch('');
                        setStatus('');
                        setScope('upcoming');
                      }
                    : undefined
                }
                actionTo={hasFilters ? undefined : '/booking'}
              />
            )}
            {!loading && !listError && items.length > 0 && (
              <div className="space-y-3">
                {items.map((b) => (
                  <BookingRow
                    key={b._id}
                    booking={b}
                    role={role}
                    busyId={busyId}
                    onStatus={handleStatus}
                    onEdit={(booking) => {
                      setEditing(booking);
                      setFormOpen(true);
                    }}
                    onDelete={(booking) => {
                      setConfirmError('');
                      setConfirm({ type: 'delete', booking });
                    }}
                  />
                ))}
              </div>
            )}
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} disabled={loading} />
          </div>
        </section>
      </div>

      <ConfirmModal
        open={Boolean(confirm)}
        title="Сигурен ли си?"
        message={
          confirm?.type === 'delete'
            ? `Резервацията на ${confirm.booking.clientName} за ${formatDate(confirm.booking.date)} ще бъде изтрита завинаги.`
            : `Резервацията за „${confirm?.booking.serviceTitle}“ на ${formatDate(confirm?.booking.date)} в ${confirm?.booking.time} ще бъде отказана.`
        }
        confirmText={confirm?.type === 'delete' ? 'Изтрий' : 'Да, откажи'}
        cancelText="Отказ"
        loading={confirmLoading}
        error={confirmError}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />

      {role === 'admin' && <BookingFormModal open={formOpen} booking={editing} onClose={closeForm} onSaved={onSaved} />}
    </div>
  );
}
