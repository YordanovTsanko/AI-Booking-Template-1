import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getErrorFeedback, getFieldErrors } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import CustomDropdown from '../components/CustomDropdown';
import InlineFeedback from '../components/InlineFeedback';
import EmptyState from '../components/EmptyState';
import Calendar from '../components/Calendar';
import PageHeader from '../components/PageHeader';
import ServiceCard, { ServiceImage } from '../components/ServiceCard';
import { SkeletonGrid } from '../components/Skeleton';
import { formatDate, formatDuration, formatPrice, parseDateStr, partOfDay } from '../utils/format';
import { BARBER_IMAGES } from '../utils/images';
import type { ApiResponse, Availability, Booking, Feedback, FieldErrors, Service, StaffMember } from '../types';

type Step = 1 | 2 | 3;
const STEPS = ['Избери услуга', 'Избери служител и дата', 'Потвърди'];
// Short labels for narrow phone screens
const STEPS_SHORT = ['Услуга', 'Служител', 'Потвърди'];

interface StepperProps {
  step: Step;
  onStepClick: (step: Step) => void;
  canGoTo: (step: Step) => boolean;
}

function Stepper({ step, onStepClick, canGoTo }: StepperProps) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Стъпки на резервацията">
      {STEPS.map((label, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label}>
            <button
              type="button"
              disabled={!canGoTo(n)}
              onClick={() => onStepClick(n)}
              aria-current={active ? 'step' : undefined}
              className={`flex w-full min-w-0 flex-col items-center gap-1.5 rounded-2xl border px-1.5 py-2.5 text-center transition sm:flex-row sm:gap-2 sm:px-4 sm:py-3 sm:text-left ${
                active ? 'border-brand-500 bg-brand-600/15' : done ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-ink-800'
              } disabled:cursor-not-allowed`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
                  active ? 'bg-accent-600 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'
                }`}
              >
                {done ? '✓' : n}
              </span>
              <span className={`min-w-0 text-[11px] leading-tight font-semibold uppercase tracking-wide sm:text-sm ${active ? 'text-white' : 'text-slate-400'}`}>
                <span className="sm:hidden">{STEPS_SHORT[i]}</span>
                <span className="hidden sm:inline">{label}</span>
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
  const [step, setStep] = useState<Step>(() => {
    if (searchParams.get('service') && searchParams.get('staff') && searchParams.get('date') && searchParams.get('time')) return 3;
    if (searchParams.get('service')) return 2;
    return 1;
  });

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const debouncedServiceSearch = useDebounce(serviceSearch, 300);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsFeedback, setSlotsFeedback] = useState<Feedback | null>(null);
  const [slotsReload, setSlotsReload] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [created, setCreated] = useState<Booking | null>(null);

  const selectedService = useMemo(() => services.find((s) => s._id === serviceId) || null, [services, serviceId]);
  const selectedStaff = useMemo(() => staff.find((s) => s._id === staffId) || null, [staff, staffId]);

  // Keep URL in sync (shareable / survives login redirect)
  useEffect(() => {
    const params: Record<string, string> = {};
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
      .get<ApiResponse<Service[]>>('/services', { params: { limit: 100, sort: 'title_asc', search: debouncedServiceSearch || undefined } })
      .then((res) => {
        if (!cancelled) setServices(res.data.data || []);
      })
      .catch((err: unknown) => {
        if (!cancelled) setServicesError(getErrorFeedback(err).message);
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedServiceSearch]);

  // A pre-selected service (from URL) must be known even if filtered out by search
  useEffect(() => {
    if (!serviceId || services.some((s) => s._id === serviceId) || servicesLoading) return;
    api
      .get<ApiResponse<Service>>(`/services/${serviceId}`)
      .then((res) => setServices((prev) => [res.data.data, ...prev]))
      .catch((err: unknown) => {
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
      .get<ApiResponse<StaffMember[]>>('/staff', { params: { serviceId } })
      .then((res) => {
        if (cancelled) return;
        const list = res.data.data || [];
        setStaff(list);
        setStaffId((current) => {
          if (current && !list.some((s) => s._id === current)) {
            setTime('');
            return list.length === 1 ? list[0]._id : '';
          }
          if (!current && list.length === 1) return list[0]._id;
          return current;
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) setStaffError(getErrorFeedback(err).message);
      })
      .finally(() => {
        if (!cancelled) setStaffLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
      .get<ApiResponse<Availability>>('/bookings/availability', { params: { serviceId, staffId, date } })
      .then((res) => {
        if (cancelled) return;
        setAvailability(res.data.data);
        const slots = res.data.data?.slots || [];
        setSlotsFeedback({ type: slots.length ? 'success' : 'warning', message: res.data.message });
        setTime((current) => (current && !slots.includes(current) ? '' : current));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setAvailability(null);
        setSlotsFeedback({ type: 'error', message: getErrorFeedback(err).message });
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, staffId, date, slotsReload]);

  const groupedSlots = useMemo(() => {
    const groups: Record<string, string[]> = {};
    (availability?.slots || []).forEach((t) => {
      const key = partOfDay(t);
      (groups[key] = groups[key] || []).push(t);
    });
    return groups;
  }, [availability]);

  const canGoTo = (n: Step): boolean => {
    if (created) return false;
    if (n === 1) return true;
    if (n === 2) return Boolean(serviceId);
    return Boolean(serviceId && staffId && date && time);
  };

  const chooseService = (service: Service) => {
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
      const res = await api.post<ApiResponse<Booking>>('/bookings', { serviceId, staffId, date, time, notes: notes.trim() || undefined });
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

  const pickAnotherSlot = () => {
    setSlotsReload((k) => k + 1);
    setTime('');
    setFeedback(null);
    setStep(2);
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
  const isConflict = feedback?.status === 409;

  return (
    <div>
      <PageHeader eyebrow="Онлайн резервация" title="Запази час" subtitle="Три лесни стъпки и си готов. Можеш да питаш и AI асистента долу вдясно." image={BARBER_IMAGES.tools} />

      <div className="container-page">
        <div className="relative z-10 -mt-8">
          <Stepper step={step} onStepClick={setStep} canGoTo={canGoTo} />
        </div>

        {/* STEP 1 – SERVICE */}
        {step === 1 && (
          <section className="mt-8 animate-fade-in" aria-labelledby="step1-title">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 id="step1-title" className="font-display text-2xl font-semibold uppercase tracking-wide text-white">
                1. Избери услуга
              </h2>
              <input type="search" value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} placeholder="Търси услуга..." className="input sm:max-w-xs" aria-label="Търси услуга" />
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
          <section className="mt-8 grid animate-fade-in grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]" aria-labelledby="step2-title">
            <div className="card min-w-0 space-y-6 p-4 sm:p-6">
              <h2 id="step2-title" className="font-display text-xl sm:text-2xl font-semibold uppercase tracking-wide text-white">
                2. Служител и дата
              </h2>

              {selectedService && (
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <ServiceImage service={selectedService} className="h-14 w-14 shrink-0 rounded-lg" compact />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{selectedService.title}</p>
                    <p className="text-xs text-slate-400">
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
                label="Бръснар / служител"
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
                <p className="-mt-3 text-xs text-slate-400">
                  Работно време: {selectedStaff.workStart} – {selectedStaff.workEnd}
                </p>
              )}

              <div>
                <p className="label">Дата</p>
                <div className={`rounded-2xl border border-white/10 bg-ink-900/60 p-2 sm:p-4 ${!staffId ? 'pointer-events-none opacity-40' : ''}`} aria-disabled={!staffId}>
                  <Calendar
                    value={date}
                    onChange={(d) => {
                      setDate(d);
                      setTime('');
                    }}
                    isDateDisabled={(d) => (selectedStaff ? !selectedStaff.workingDays?.includes(parseDateStr(d).getDay()) : true)}
                  />
                </div>
                {!staffId && <p className="mt-2 text-xs text-slate-400">Първо избери служител.</p>}
                {fieldErrors.date && <p className="field-error">{fieldErrors.date}</p>}
              </div>
            </div>

            <div className="card flex min-w-0 flex-col p-4 sm:p-6">
              <h3 className="font-display text-xl font-semibold uppercase tracking-wide text-white">Свободни часове</h3>
              <p className="text-sm text-slate-400">{date ? formatDate(date) : 'Избери дата от календара'}</p>

              <div className="mt-5 flex-1">
                {slotsLoading && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="status" aria-label="Зарежда...">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="skeleton h-10 rounded-xl" />
                    ))}
                  </div>
                )}

                {!slotsLoading && slotsFeedback && slotsFeedback.type !== 'success' && <InlineFeedback type={slotsFeedback.type} message={slotsFeedback.message} />}

                {!slotsLoading && !date && (
                  <div className="flex h-full min-h-[12rem] items-center justify-center rounded-2xl border-2 border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                    Избери служител и дата, за да видиш свободните часове.
                  </div>
                )}

                {!slotsLoading &&
                  Object.entries(groupedSlots).map(([group, slots]) => (
                    <div key={group} className="mb-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{group}</p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {slots.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTime(t)}
                            aria-pressed={time === t}
                            className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                              time === t ? 'border-accent-500 bg-accent-600 text-white shadow-glow-red' : 'border-white/10 bg-white/5 text-slate-200 hover:border-brand-500/60 hover:bg-brand-600/15'
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

              <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-between">
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
            <div className="card overflow-hidden">
              <div className="barber-stripes h-1.5 w-full" aria-hidden="true" />
              <div className="p-4 sm:p-8">
                <h2 id="step3-title" className="font-display text-2xl font-semibold uppercase tracking-wide text-white">
                  {created ? 'Резервацията е готова 💈' : '3. Потвърди резервацията'}
                </h2>

                <dl className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 bg-ink-900/50">
                  {[
                    ['Услуга', selectedService?.title || created?.serviceTitle || '—'],
                    ['Служител', selectedStaff?.name || created?.staffName || '—'],
                    ['Дата', date ? formatDate(date) : '—'],
                    ['Час', time || '—'],
                    ['Продължителност', selectedService ? formatDuration(selectedService.duration) : '—'],
                    ['Цена', selectedService ? formatPrice(selectedService.price) : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                      <dt className="text-slate-400">{k}</dt>
                      <dd className={`text-right font-semibold ${k === 'Цена' ? 'text-accent-400' : 'text-white'}`}>{v}</dd>
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
                      <Link to={`/register?redirect=${redirectBack}`} className="btn-accent flex-1">
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
                        Бележка към бръснаря (по желание)
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
                      <div className="mt-1 flex justify-between text-xs text-slate-500">
                        {fieldErrors.notes ? <p className="field-error mt-0">{fieldErrors.notes}</p> : <span>Резервираш като {user?.name}</span>}
                        <span>{notes.length}/500</span>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                      <button type="button" onClick={isConflict ? pickAnotherSlot : () => setStep(2)} className="btn-secondary" disabled={submitting}>
                        ← {isConflict ? 'Избери друг час' : 'Назад'}
                      </button>
                      <button type="button" onClick={isConflict ? pickAnotherSlot : submit} className="btn-accent uppercase tracking-wider" disabled={submitting || !time}>
                        {submitting ? 'Зарежда...' : isConflict ? 'Виж свободните часове' : 'Потвърди резервацията'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}