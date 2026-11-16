import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getErrorFeedback, getFieldErrors } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import useDebounce from '../hooks/useDebounce.js';
import CustomDropdown from '../components/CustomDropdown.jsx';
import InlineFeedback from '../components/InlineFeedback.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Calendar from '../components/Calendar.jsx';
import ServiceCard, { ServiceImage } from '../components/ServiceCard.jsx';
import { SkeletonGrid } from '../components/Skeleton.jsx';
import { formatDate, formatDuration, formatPrice, parseDateStr, partOfDay } from '../utils/format.js';

const STEPS = ['Избери услуга', 'Избери служител и дата', 'Потвърди'];

function Stepper({ step, onStepClick, canGoTo }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Стъпки на резервацията">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label}>
            <button
              type="button"
              disabled={!canGoTo(n)}
              onClick={() => onStepClick(n)}
              aria-current={active ? 'step' : undefined}
              className={`flex w-full flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center transition sm:flex-row sm:px-4 sm:text-left ${
                active ? 'border-brand-500 bg-brand-50' : done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
              } disabled:cursor-not-allowed`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  active ? 'bg-brand-600 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {done ? '✓' : n}
              </span>
              <span className={`text-xs font-semibold sm:text-sm ${active ? 'text-brand-800' : 'text-slate-600'}`}>
                {n}. {label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export default function BookingPage() {
  const { isAuthenticated, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [serviceId, setServiceId] = useState(searchParams.get('service') || '');
  const [staffId, setStaffId] = useState(searchParams.get('staff') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [time, setTime] = useState(searchParams.get('time') || '');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(() => {
    if (searchParams.get('service') && searchParams.get('staff') && searchParams.get('date') && searchParams.get('time')) return 3;
    if (searchParams.get('service')) return 2;
    return 1;
  });

  // Data
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const debouncedServiceSearch = useDebounce(serviceSearch, 300);

  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  const [availability, setAvailability] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsFeedback, setSlotsFeedback] = useState(null);
  const [slotsReload, setSlotsReload] = useState(0);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [created, setCreated] = useState(null);

  const selectedService = useMemo(() => services.find((s) => s._id === serviceId) || null, [services, serviceId]);
  const selectedStaff = useMemo(() => staff.find((s) => s._id === staffId) || null, [staff, staffId]);

  // Keep URL in sync (shareable / survives login redirect)
  useEffect(() => {
    const params = {};
    if (serviceId) params.service = serviceId;
    if (staffId) params.staff = staffId;
    if (date) params.date = date;
    if (time) params.time = time;
    setSearchParams(params, { replace: true });
  }, [serviceId, staffId, date, time, setSearchParams]);

  // Load services
  useEffect(() => {
    let cancelled = false;
    setServicesLoading(true);
    setServicesError('');
    api
      .get('/services', { params: { limit: 100, sort: 'title_asc', search: debouncedServiceSearch || undefined } })
      .then((res) => !cancelled && setServices(res.data.data || []))
      .catch((err) => !cancelled && setServicesError(getErrorFeedback(err).message))
      .finally(() => !cancelled && setServicesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedServiceSearch]);

  // Make sure a pre-selected service (from URL) is known even if filtered out by search
  useEffect(() => {
    if (!serviceId || services.some((s) => s._id === serviceId) || servicesLoading) return;
    api
      .get(`/services/${serviceId}`)
      .then((res) => setServices((prev) => [res.data.data, ...prev]))
      .catch((err) => {
        setFeedback({ type: 'error', message: getErrorFeedback(err).message });
        setServiceId('');
        setStep(1);
      });
  }, [serviceId, services, servicesLoading]);

  // Load staff for the selected service
  useEffect(() => {
    if (!serviceId) {
      setStaff([]);
      return undefined;
    }
    let cancelled = false;
    setStaffLoading(true);
    setStaffError('');
    api
      .get('/staff', { params: { serviceId } })
      .then((res) => {
        if (cancelled) return;
        const list = res.data.data || [];
        setStaff(list);
        if (staffId && !list.some((s) => s._id === staffId)) {
          setStaffId('');
          setTime('');
        }
        if (!staffId && list.length === 1) setStaffId(list[0]._id);
      })
      .catch((err) => !cancelled && setStaffError(getErrorFeedback(err).message))
      .finally(() => !cancelled && setStaffLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  // Load free slots
  useEffect(() => {
    if (!serviceId || !staffId || !date) {
      setAvailability(null);
      setSlotsFeedback(null);
      return undefined;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsFeedback(null);
    api
      .get('/bookings/availability', { params: { serviceId, staffId, date } })
      .then((res) => {
        if (cancelled) return;
        setAvailability(res.data.data);
        const slots = res.data.data?.slots || [];
        setSlotsFeedback({ type: slots.length ? 'success' : 'warning', message: res.data.message });
        if (time && !slots.includes(time)) setTime('');
      })
      .catch((err) => {
        if (cancelled) return;
        setAvailability(null);
        setSlotsFeedback({ type: 'error', message: getErrorFeedback(err).message });
      })
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, staffId, date, slotsReload]);

  const groupedSlots = useMemo(() => {
    const groups = {};
    (availability?.slots || []).forEach((t) => {
      const key = partOfDay(t);
      (groups[key] = groups[key] || []).push(t);
    });
    return groups;
  }, [availability]);

  const canGoTo = (n) => {
    if (created) return false;
    if (n === 1) return true;
    if (n === 2) return Boolean(serviceId);
    return Boolean(serviceId && staffId && date && time);
  };

  const chooseService = (service) => {
    if (service._id !== serviceId) {
      setServiceId(service._id);
      setStaffId('');
      setTime('');
    }
    setFeedback(null);
    setStep(2);
  };

  const submit = async () => {
    setSubmitting(true);
    setFeedback(null);
    setFieldErrors({});
    try {
      const res = await api.post('/bookings', { serviceId, staffId, date, time, notes: notes.trim() || undefined });
      setCreated(res.data.data);
      setFeedback({ type: 'success', message: res.data.message });
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors, status: fb.status });
      setFieldErrors(getFieldErrors(fb.errors));
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    setCreated(null);
    setFeedback(null);
    setServiceId('');
    setStaffId('');
    setDate('');
    setTime('');
    setNotes('');
    setStep(1);
  };

  const redirectBack = encodeURIComponent(`/booking?${new URLSearchParams({ service: serviceId, staff: staffId, date, time }).toString()}`);

  return (
    <div className="container-page py-10">
      <div className="max-w-2xl">
        <h1 className="section-title">Резервирай час</h1>
        <p className="mt-2 text-slate-500">Три лесни стъпки и си готов. Можеш да питаш и AI асистента долу вдясно.</p>
      </div>

      <div className="mt-8">
        <Stepper step={step} onStepClick={setStep} canGoTo={canGoTo} />
      </div>

      {/* STEP 1 – SERVICE */}
      {step === 1 && (
        <section className="mt-8 animate-fade-in" aria-labelledby="step1-title">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 id="step1-title" className="text-xl font-bold text-slate-900">
              1. Избери услуга
            </h2>
            <input
              type="search"
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              placeholder="Търси услуга..."
              className="input sm:max-w-xs"
              aria-label="Търси услуга"
            />
          </div>
          {feedback?.type === 'error' && <InlineFeedback type="error" message={feedback.message} className="mt-4" onClose={() => setFeedback(null)} />}
          <div className="mt-6">
            {servicesLoading && <SkeletonGrid count={6} />}
            {!servicesLoading && servicesError && <InlineFeedback type="error" message={servicesError} />}
            {!servicesLoading && !servicesError && services.length === 0 && (
              <EmptyState description={serviceSearch ? 'Няма услуги с това име. Пробвай с друга дума.' : 'Все още няма добавени услуги за резервация.'} actionLabel="Към услугите" actionTo="/services" />
            )}
            {!servicesLoading && !servicesError && services.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s) => (
                  <ServiceCard key={s._id} service={s} onSelect={chooseService} selected={s._id === serviceId} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* STEP 2 – STAFF + DATE + TIME */}
      {step === 2 && (
        <section className="mt-8 grid animate-fade-in gap-6 lg:grid-cols-[1fr_1.2fr]" aria-labelledby="step2-title">
          <div className="card space-y-6 p-6">
            <h2 id="step2-title" className="text-xl font-bold text-slate-900">
              2. Избери служител и дата
            </h2>

            {selectedService && (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <ServiceImage service={selectedService} className="h-14 w-14 shrink-0 rounded-lg" compact />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{selectedService.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatPrice(selectedService.price)} · {formatDuration(selectedService.duration)}
                  </p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="btn-ghost btn-sm">
                  Смени
                </button>
              </div>
            )}

            {staffError && <InlineFeedback type="error" message={staffError} />}

            <CustomDropdown
              label="Служител"
              options={staff.map((s) => ({ value: s._id, label: s.name, description: s.position || undefined }))}
              value={staffId}
              onChange={(v) => {
                setStaffId(v);
                setTime('');
              }}
              placeholder={staffLoading ? 'Зарежда...' : staff.length ? 'Избери служител' : 'Няма служители за тази услуга'}
              disabled={staffLoading || staff.length === 0}
              error={fieldErrors.staffId}
              searchPlaceholder="Търси служител..."
            />

            {selectedStaff && (
              <p className="-mt-3 text-xs text-slate-500">
                Работно време: {selectedStaff.workStart} – {selectedStaff.workEnd}
              </p>
            )}

            <div>
              <p className="label">Дата</p>
              <div className={`rounded-2xl border p-4 ${!staffId ? 'pointer-events-none opacity-50' : 'border-slate-200'}`} aria-disabled={!staffId}>
                <Calendar
                  value={date}
                  onChange={(d) => {
                    setDate(d);
                    setTime('');
                  }}
                  isDateDisabled={(d) => (selectedStaff ? !selectedStaff.workingDays?.includes(parseDateStr(d).getDay()) : true)}
                />
              </div>
              {!staffId && <p className="mt-2 text-xs text-slate-500">Първо избери служител.</p>}
              {fieldErrors.date && <p className="field-error">{fieldErrors.date}</p>}
            </div>
          </div>

          <div className="card flex flex-col p-6">
            <h3 className="text-lg font-bold text-slate-900">Свободни часове</h3>
            <p className="text-sm text-slate-500">{date ? formatDate(date) : 'Избери дата от календара'}</p>

            <div className="mt-5 flex-1">
              {slotsLoading && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="status" aria-label="Зарежда...">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 rounded-xl" />
                  ))}
                </div>
              )}

              {!slotsLoading && slotsFeedback && slotsFeedback.type !== 'success' && (
                <InlineFeedback type={slotsFeedback.type} message={slotsFeedback.message} />
              )}

              {!slotsLoading && !date && (
                <div className="flex h-full min-h-[12rem] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                  Избери служител и дата, за да видиш свободните часове.
                </div>
              )}

              {!slotsLoading &&
                Object.entries(groupedSlots).map(([group, slots]) => (
                  <div key={group} className="mb-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTime(t)}
                          aria-pressed={time === t}
                          className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                            time === t ? 'border-brand-600 bg-brand-600 text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              {fieldErrors.time && <p className="field-error">{fieldErrors.time}</p>}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                ← Назад
              </button>
              <button type="button" onClick={() => setStep(3)} disabled={!time} className="btn-primary">
                Напред →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STEP 3 – CONFIRM */}
      {step === 3 && (
        <section className="mx-auto mt-8 max-w-2xl animate-fade-in" aria-labelledby="step3-title">
          <div className="card p-6 sm:p-8">
            <h2 id="step3-title" className="text-xl font-bold text-slate-900">
              {created ? 'Резервацията е готова 🎉' : '3. Потвърди резервацията'}
            </h2>

            <dl className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
              {[
                ['Услуга', selectedService?.title || created?.serviceTitle || '—'],
                ['Служител', selectedStaff?.name || created?.staffName || '—'],
                ['Дата', date ? formatDate(date) : '—'],
                ['Час', time || '—'],
                ['Продължителност', selectedService ? formatDuration(selectedService.duration) : '—'],
                ['Цена', selectedService ? formatPrice(selectedService.price) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-semibold text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>

            {feedback && <InlineFeedback type={feedback.type} message={feedback.message} errors={feedback.errors} className="mt-6" />}

            {created ? (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link to="/dashboard" className="btn-primary flex-1">
                  Към моите резервации
                </Link>
                <button type="button" onClick={startOver} className="btn-secondary flex-1">
                  Нова резервация
                </button>
              </div>
            ) : !isAuthenticated ? (
              <div className="mt-6">
                <InlineFeedback type="info" message="Почти готово! Влез или се регистрирай, за да потвърдиш резервацията. Изборът ти ще бъде запазен." />
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link to={`/login?redirect=${redirectBack}`} className="btn-primary flex-1">
                    Вход
                  </Link>
                  <Link to={`/register?redirect=${redirectBack}`} className="btn-secondary flex-1">
                    Регистрация
                  </Link>
                </div>
                <button type="button" onClick={() => setStep(2)} className="btn-ghost mt-3 w-full">
                  ← Назад
                </button>
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <label htmlFor="notes" className="label">
                    Бележка към салона (по желание)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      if (fieldErrors.notes) setFieldErrors((f) => ({ ...f, notes: '' }));
                    }}
                    maxLength={500}
                    rows={3}
                    placeholder="Например: искам по-късо отстрани"
                    className={`input resize-none ${fieldErrors.notes ? 'input-error' : ''}`}
                    disabled={submitting}
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-400">
                    {fieldErrors.notes ? <p className="field-error mt-0">{fieldErrors.notes}</p> : <span>Резервираш като {user?.name}</span>}
                    <span>{notes.length}/500</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep(2)} className="btn-secondary" disabled={submitting}>
                    ← {feedback?.status === 409 ? 'Избери друг час' : 'Назад'}
                  </button>
                  <button type="button" onClick={feedback?.status === 409 ? () => { setSlotsReload((k) => k + 1); setTime(''); setFeedback(null); setStep(2); } : submit} className="btn-primary" disabled={submitting || !time}>
                    {submitting ? 'Зарежда...' : feedback?.status === 409 ? 'Виж свободните часове' : 'Потвърди резервацията'}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
