import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorFeedback, getFieldErrors } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import useDebounce from '../hooks/useDebounce.js';
import CustomDropdown from '../components/CustomDropdown.jsx';
import InlineFeedback from '../components/InlineFeedback.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Modal from '../components/Modal.jsx';
import Pagination from '../components/Pagination.jsx';
import { SkeletonList, SkeletonStats } from '../components/Skeleton.jsx';
import { BOOKING_STATUS, formatDate, formatDuration, formatPrice, todayStr, ROLE_LABELS } from '../utils/format.js';

const STATUS_FILTER = [
  { value: 'pending', label: 'Чакащи' },
  { value: 'confirmed', label: 'Потвърдени' },
  { value: 'completed', label: 'Завършени' },
  { value: 'cancelled', label: 'Отказани' },
];

const SCOPE_OPTIONS = [
  { value: 'all', label: 'Всички дати' },
  { value: 'upcoming', label: 'Предстоящи' },
  { value: 'past', label: 'Минали' },
];

const isFuture = (b) => new Date(b.startAt) > new Date();

/* ------------------------------------------------------------------ */
function StatCard({ label, value, hint, icon, accent = 'from-brand-500 to-purple-500' }) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-15`} aria-hidden="true" />
      <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <span aria-hidden="true">{icon}</span> {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = BOOKING_STATUS[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
  return <span className={`badge ${s.className}`}>{s.label}</span>;
}

/* ------------------------------------------------------------------ */
function BookingRow({ booking, role, onStatus, onEdit, onDelete, busyId }) {
  const busy = busyId === booking._id;
  const future = isFuture(booking);
  const actions = [];

  if (role === 'client') {
    if (['pending', 'confirmed'].includes(booking.status) && future) {
      actions.push({ key: 'cancel', label: 'Откажи', className: 'btn-secondary btn-sm text-rose-600', onClick: () => onStatus(booking, 'cancelled', true) });
    }
  } else {
    if (booking.status === 'pending') {
      actions.push({ key: 'confirm', label: 'Потвърди', className: 'btn-success btn-sm', onClick: () => onStatus(booking, 'confirmed') });
    }
    if (['pending', 'confirmed'].includes(booking.status) && !future) {
      actions.push({ key: 'complete', label: 'Завърши', className: 'btn-primary btn-sm', onClick: () => onStatus(booking, 'completed') });
    }
    if (['pending', 'confirmed'].includes(booking.status)) {
      actions.push({ key: 'cancel', label: 'Откажи', className: 'btn-secondary btn-sm text-rose-600', onClick: () => onStatus(booking, 'cancelled', true) });
    }
    if (role === 'admin' && booking.status === 'cancelled' && future) {
      actions.push({ key: 'restore', label: 'Възстанови', className: 'btn-secondary btn-sm', onClick: () => onStatus(booking, 'pending') });
    }
    if (role === 'admin') {
      actions.push({ key: 'edit', label: 'Редактирай', className: 'btn-secondary btn-sm', onClick: () => onEdit(booking) });
      actions.push({ key: 'delete', label: 'Изтрий', className: 'btn-ghost btn-sm text-rose-600 hover:bg-rose-50', onClick: () => onDelete(booking) });
    }
  }

  return (
    <article className={`card flex flex-col gap-4 p-4 transition sm:flex-row sm:items-center ${busy ? 'opacity-60' : ''}`}>
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <span className="text-lg font-extrabold leading-none">{booking.date?.slice(8)}</span>
        <span className="text-[10px] font-semibold uppercase">{formatDate(booking.date, { withWeekday: false }).split(' ')[1]?.slice(0, 3)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-slate-900">{booking.service?.title || booking.serviceTitle}</h3>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-0.5 text-sm text-slate-500">
          {formatDate(booking.date)} · {booking.time}–{booking.endTime} · {formatDuration(booking.duration)} · {formatPrice(booking.price)}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">
          {role !== 'staff' && <>👤 {booking.staff?.name || booking.staffName}</>}
          {role !== 'client' && (
            <>
              {role !== 'staff' && ' · '}🙋 {booking.clientName}
              {booking.clientPhone && <span className="text-slate-400"> ({booking.clientPhone})</span>}
            </>
          )}
        </p>
        {booking.notes && <p className="mt-1 line-clamp-2 text-xs italic text-slate-400">„{booking.notes}“</p>}
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
const EMPTY_FORM = { serviceId: '', staffId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '', notes: '', status: 'confirmed' };

function BookingFormModal({ open, booking, onClose, onSaved }) {
  const isEdit = Boolean(booking);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotsMsg, setSlotsMsg] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFeedback(null);
    setForm(
      booking
        ? {
            serviceId: booking.service?._id || booking.service || '',
            staffId: booking.staff?._id || booking.staff || '',
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
      .get('/services', { params: { limit: 100, sort: 'title_asc' } })
      .then((res) => setServices(res.data.data || []))
      .catch((err) => setFeedback({ type: 'error', message: getErrorFeedback(err).message }));
  }, [open, booking]);

  useEffect(() => {
    if (!open || !form.serviceId) {
      setStaff([]);
      return;
    }
    api
      .get('/staff', { params: { serviceId: form.serviceId } })
      .then((res) => setStaff(res.data.data || []))
      .catch((err) => setFeedback({ type: 'error', message: getErrorFeedback(err).message }));
  }, [open, form.serviceId]);

  useEffect(() => {
    if (!open || !form.serviceId || !form.staffId || !form.date) {
      setSlots([]);
      setSlotsMsg('');
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    api
      .get('/bookings/availability', { params: { serviceId: form.serviceId, staffId: form.staffId, date: form.date, excludeId: booking?._id } })
      .then((res) => {
        if (cancelled) return;
        let list = res.data.data?.slots || [];
        // Keep the current time selectable when editing without schedule changes
        if (booking && form.date === booking.date && form.staffId === (booking.staff?._id || booking.staff) && !list.includes(booking.time)) {
          list = [...list, booking.time].sort();
        }
        setSlots(list);
        setSlotsMsg(list.length ? '' : res.data.message);
      })
      .catch((err) => !cancelled && setSlotsMsg(getErrorFeedback(err).message))
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, form.serviceId, form.staffId, form.date, booking]);

  const set = (name, value) => {
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

  const validate = () => {
    const e = {};
    if (!form.serviceId) e.serviceId = 'Избери услуга';
    if (!form.staffId) e.staffId = 'Избери служител';
    if (!form.date) e.date = 'Избери дата';
    if (!form.time) e.time = 'Избери час';
    if (!isEdit && form.clientName.trim().length < 2) e.clientName = 'Въведи име на клиента (поне 2 символа)';
    if (form.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.clientEmail.trim())) e.clientEmail = 'Въведи валиден имейл адрес';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev?.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setFeedback({ type: 'error', message: 'Моля, попълни правилно отбелязаните полета.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    const payload = {
      serviceId: form.serviceId,
      staffId: form.staffId,
      date: form.date,
      time: form.time,
      notes: form.notes.trim(),
      status: form.status,
    };
    const isWalkIn = !isEdit || !booking.client;
    if (isWalkIn) {
      payload.clientName = form.clientName.trim() || undefined;
      payload.clientPhone = form.clientPhone.trim() || undefined;
      payload.clientEmail = form.clientEmail.trim() || undefined;
    }
    try {
      const res = isEdit ? await api.put(`/bookings/${booking._id}`, payload) : await api.post('/bookings', payload);
      onSaved(res.data.message);
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors });
      setErrors(getFieldErrors(fb.errors));
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = isEdit
    ? Object.entries(BOOKING_STATUS).map(([value, s]) => ({ value, label: s.label }))
    : [
        { value: 'confirmed', label: 'Потвърдена' },
        { value: 'pending', label: 'Чакаща' },
      ];

  const clientEditable = !isEdit || !booking?.client;

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
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={saving}>
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
            <input
              id="bf-date"
              type="date"
              min={isEdit ? undefined : todayStr()}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className={`input ${errors.date ? 'input-error' : ''}`}
            />
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
            {slotsMsg && !errors.time && <p className="mt-1.5 text-xs text-amber-600">{slotsMsg}</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Клиент</p>
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
            <p className="text-sm text-slate-600">
              {booking.clientName} · {booking.clientEmail} {booking.clientPhone && `· ${booking.clientPhone}`}
              <span className="mt-1 block text-xs text-slate-400">Регистриран клиент – данните се управляват от самия него.</span>
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
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || 'client';
  const isManager = role === 'admin' || role === 'staff';

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(isManager);
  const [statsError, setStatsError] = useState('');

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const debouncedSearch = useDebounce(search, 400);

  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'cancel' | 'delete', booking }
  const [confirmError, setConfirmError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = useCallback(() => setReload((r) => r + 1), []);

  // Stats
  useEffect(() => {
    if (!isManager) return;
    setStatsLoading(true);
    setStatsError('');
    api
      .get('/bookings/stats')
      .then((res) => setStats(res.data.data))
      .catch((err) => setStatsError(getErrorFeedback(err).message))
      .finally(() => setStatsLoading(false));
  }, [isManager, reload]);

  useEffect(() => setPage(1), [debouncedSearch, status, scope]);

  // List
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setListError('');
    api
      .get('/bookings', {
        params: { page, limit: 8, search: debouncedSearch || undefined, status: status || undefined, scope: scope === 'all' ? undefined : scope },
      })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.data || []);
        setMeta(res.data.meta || { totalPages: 1, total: 0 });
      })
      .catch((err) => !cancelled && setListError(getErrorFeedback(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, status, scope, reload]);

  const changeStatus = async (booking, nextStatus) => {
    setBusyId(booking._id);
    setFeedback(null);
    try {
      const res = await api.patch(`/bookings/${booking._id}/status`, { status: nextStatus });
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

  const handleStatus = (booking, nextStatus, needsConfirm = false) => {
    if (needsConfirm) {
      setConfirmError('');
      setConfirm({ type: 'cancel', booking });
      return;
    }
    changeStatus(booking, nextStatus);
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
      const res = await api.delete(`/bookings/${confirm.booking._id}`);
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

  const openEdit = (booking) => {
    setEditing(booking);
    setFormOpen(true);
  };

  const onSaved = (message) => {
    setFormOpen(false);
    setEditing(null);
    setFeedback({ type: 'success', message });
    refresh();
  };

  const hasFilters = Boolean(search || status || scope !== 'upcoming');

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Предстоящи', value: stats.upcomingCount, hint: `${stats.pendingCount} чакат потвърждение`, icon: '📅' },
      { label: 'Приходи', value: formatPrice(stats.revenue), hint: `${formatPrice(stats.revenueThisMonth)} този месец`, icon: '💶', accent: 'from-emerald-500 to-teal-500' },
      { label: 'Очаквани приходи', value: formatPrice(stats.expectedRevenue), hint: 'от предстоящите часове', icon: '📈', accent: 'from-sky-500 to-indigo-500' },
      { label: 'Клиенти', value: stats.totalClients, hint: `${stats.totalBookings} резервации общо`, icon: '👥', accent: 'from-amber-500 to-pink-500' },
    ];
  }, [stats]);

  return (
    <div className="container-page py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand-600">{ROLE_LABELS[role]}</p>
          <h1 className="section-title">Здравей, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-slate-500">
            {role === 'admin' && 'Ето как върви бизнесът днес.'}
            {role === 'staff' && 'Ето твоите часове.'}
            {role === 'client' && 'Тук са всички твои резервации.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {role === 'admin' && (
            <>
              <Link to="/admin/services" className="btn-secondary">
                Услуги и екип
              </Link>
              <button type="button" onClick={openCreate} className="btn-primary">
                + Нова резервация
              </button>
            </>
          )}
          {role !== 'admin' && (
            <Link to="/booking" className="btn-primary">
              + Нова резервация
            </Link>
          )}
        </div>
      </div>

      {/* STATS */}
      {isManager && (
        <section className="mt-8" aria-label="Статистика">
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
              <h2 className="font-bold text-slate-900">Следващи часове</h2>
              {stats.upcoming.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Няма предстоящи часове. Време е за малко почивка ☕</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {stats.upcoming.map((b) => (
                    <li key={b._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                      <span className="font-semibold text-slate-800">
                        {formatDate(b.date)} · {b.time}
                      </span>
                      <span className="text-slate-500">
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

      {/* LIST */}
      <section className="mt-10" aria-labelledby="bookings-title">
        <h2 id="bookings-title" className="text-xl font-bold text-slate-900">
          {role === 'client' ? 'Моите резервации' : 'Резервации'}
        </h2>

        <div className="card mt-4 grid gap-3 p-4 md:grid-cols-[1fr_200px_200px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={role === 'client' ? 'Търси по услуга или служител...' : 'Търси по клиент, телефон, услуга...'}
            className="input"
            aria-label="Търси резервации"
          />
          <CustomDropdown options={STATUS_FILTER} value={status} onChange={setStatus} placeholder="Всички статуси" clearable searchable={false} />
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
                  onEdit={openEdit}
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

      <ConfirmModal
        open={Boolean(confirm)}
        title="Сигурен ли си?"
        message={
          confirm?.type === 'delete'
            ? `Резервацията на ${confirm?.booking?.clientName} за ${formatDate(confirm?.booking?.date)} ще бъде изтрита завинаги.`
            : `Резервацията за „${confirm?.booking?.serviceTitle}“ на ${formatDate(confirm?.booking?.date)} в ${confirm?.booking?.time} ще бъде отказана.`
        }
        confirmText={confirm?.type === 'delete' ? 'Изтрий' : 'Да, откажи'}
        cancelText="Отказ"
        loading={confirmLoading}
        error={confirmError}
        onConfirm={handleConfirm}
        onCancel={() => !confirmLoading && setConfirm(null)}
      />

      {role === 'admin' && (
        <BookingFormModal
          open={formOpen}
          booking={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
