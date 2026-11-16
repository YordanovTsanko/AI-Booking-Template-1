import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import api, { getErrorFeedback, getFieldErrors } from '../api/axios';
import useDebounce from '../hooks/useDebounce';
import CustomDropdown from '../components/CustomDropdown';
import InlineFeedback from '../components/InlineFeedback';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import PageHeader from '../components/PageHeader';
import { ServiceImage } from '../components/ServiceCard';
import { SkeletonList } from '../components/Skeleton';
import { formatDuration, formatPrice, TIME_OPTIONS, WEEKDAYS_SHORT_BY_INDEX } from '../utils/format';
import { BARBER_IMAGES } from '../utils/images';
import type { ApiResponse, DropdownOption, Feedback, FieldErrors, PaginationMeta, Service, StaffMember } from '../types';

const DURATION_OPTIONS: DropdownOption<number>[] = [15, 20, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300, 360].map((m) => ({ value: m, label: formatDuration(m) }));

const SORT_OPTIONS: DropdownOption[] = [
  { value: 'newest', label: 'Най-нови' },
  { value: 'title_asc', label: 'Име (А → Я)' },
  { value: 'price_asc', label: 'Цена ↑' },
  { value: 'price_desc', label: 'Цена ↓' },
  { value: 'duration_asc', label: 'Времетраене ↑' },
  { value: 'duration_desc', label: 'Времетраене ↓' },
];

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const EMPTY_META: Pick<PaginationMeta, 'totalPages' | 'total'> = { totalPages: 1, total: 0 };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[+\d\s()-]{6,20}$/;

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-3">
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-white/15'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      <span className="text-sm font-medium text-slate-300">{label}</span>
    </button>
  );
}

function Field({ id, label, error, children, hint }: { id?: string; label?: string; error?: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

/* =========================================================================
 *  SERVICE FORM
 * ========================================================================= */
interface ServiceForm {
  title: string;
  category: string;
  price: string;
  duration: number | '';
  image: string;
  description: string;
  isActive: boolean;
}

const EMPTY_SERVICE: ServiceForm = { title: '', category: '', price: '', duration: 30, image: '', description: '', isActive: true };

const validateService = (f: ServiceForm): FieldErrors => {
  const e: FieldErrors = {};
  if (!f.title.trim()) e.title = 'Името на услугата е задължително';
  else if (f.title.trim().length < 2) e.title = 'Името трябва да е поне 2 символа';
  if (!f.category.trim()) e.category = 'Категорията е задължителна';
  if (f.price === '' || Number.isNaN(Number(f.price))) e.price = 'Въведи цена';
  else if (Number(f.price) < 0) e.price = 'Цената не може да е отрицателна';
  if (!f.duration) e.duration = 'Избери продължителност';
  if (f.image && !/^(https?:\/\/|\/)\S+$/i.test(f.image.trim())) e.image = 'Въведи валиден адрес на изображение (http/https)';
  if (f.description.length > 2000) e.description = 'Описанието може да е най-много 2000 символа';
  return e;
};

interface ServiceFormModalProps {
  open: boolean;
  service: Service | null;
  categories: string[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

function ServiceFormModal({ open, service, categories, onClose, onSaved }: ServiceFormModalProps) {
  const isEdit = Boolean(service);
  const [form, setForm] = useState<ServiceForm>(EMPTY_SERVICE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [aiFeedback, setAiFeedback] = useState<Feedback | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFeedback(null);
    setAiFeedback(null);
    setForm(
      service
        ? {
            title: service.title,
            category: service.category,
            price: String(service.price),
            duration: service.duration,
            image: service.image || '',
            description: service.description || '',
            isActive: service.isActive !== false,
          }
        : EMPTY_SERVICE
    );
  }, [open, service]);

  const set = <K extends keyof ServiceForm>(name: K, value: ServiceForm[K]) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const blur = (name: keyof ServiceForm) => {
    const e = validateService(form);
    if (form[name] !== '' && e[name]) setErrors((er) => ({ ...er, [name]: e[name] }));
  };

  const generate = async () => {
    if (form.title.trim().length < 2) {
      setErrors((e) => ({ ...e, title: 'Първо въведи име на услугата' }));
      return;
    }
    setGenerating(true);
    setAiFeedback(null);
    try {
      const res = await api.post<ApiResponse<{ description: string; source: 'openai' | 'mock' }>>('/ai/generate-description', {
        title: form.title.trim(),
        category: form.category.trim() || undefined,
      });
      set('description', res.data.data.description);
      setAiFeedback({
        type: 'success',
        message: `${res.data.message}${res.data.data.source === 'mock' ? ' (локален AI – добави OPENAI_API_KEY за още по-добри текстове)' : ''}`,
      });
    } catch (err) {
      const fb = getErrorFeedback(err);
      setAiFeedback({ type: 'error', message: fb.message });
      setErrors((e) => ({ ...e, ...getFieldErrors(fb.errors) }));
    } finally {
      setGenerating(false);
    }
  };

  const submit = async (ev?: FormEvent) => {
    ev?.preventDefault();
    const e = validateService(form);
    setErrors(e);
    if (Object.keys(e).length) {
      setFeedback({ type: 'error', message: 'Моля, попълни правилно отбелязаните полета.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      duration: Number(form.duration),
      image: form.image.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
    };
    try {
      const res = service ? await api.put<ApiResponse<Service>>(`/services/${service._id}`, payload) : await api.post<ApiResponse<Service>>('/services', payload);
      onSaved(res.data.message);
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors });
      setErrors(getFieldErrors(fb.errors));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Редактирай услуга' : 'Нова услуга'}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Отказ
          </button>
          <button type="button" className="btn-primary" onClick={() => submit()} disabled={saving || generating}>
            {saving ? 'Зарежда...' : isEdit ? 'Запази промените' : 'Създай услугата'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <InlineFeedback type={feedback?.type} message={feedback?.message} errors={feedback?.errors} onClose={() => setFeedback(null)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="sf-title" label="Име на услугата" error={errors.title}>
            <input
              id="sf-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              onBlur={() => blur('title')}
              maxLength={100}
              placeholder="Например: Мъжко подстригване"
              className={`input ${errors.title ? 'input-error' : ''}`}
            />
          </Field>
          <Field id="sf-category" label="Категория" error={errors.category} hint="Избери съществуваща или напиши нова.">
            <input
              id="sf-category"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              onBlur={() => blur('category')}
              maxLength={50}
              placeholder="Например: Подстригване"
              className={`input ${errors.category ? 'input-error' : ''}`}
            />
            {categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('category', c)}
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${form.category === c ? 'border-brand-500 bg-brand-600/20 text-brand-200' : 'border-white/10 text-slate-400 hover:border-white/25'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field id="sf-price" label="Цена (€)" error={errors.price}>
            <input
              id="sf-price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              onBlur={() => blur('price')}
              placeholder="15"
              className={`input ${errors.price ? 'input-error' : ''}`}
            />
          </Field>
          <CustomDropdown<number> label="Продължителност" options={DURATION_OPTIONS} value={form.duration} onChange={(v) => set('duration', v)} placeholder="Избери" error={errors.duration} searchable={false} />
        </div>

        <Field id="sf-image" label="Снимка (URL)" error={errors.image} hint="По желание. Ако няма снимка, ще се покажат бръснарски ивици.">
          <input
            id="sf-image"
            value={form.image}
            onChange={(e) => set('image', e.target.value)}
            onBlur={() => blur('image')}
            placeholder="https://..."
            className={`input ${errors.image ? 'input-error' : ''}`}
          />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="sf-description" className="label mb-0">
              Описание
            </label>
            <button type="button" onClick={generate} disabled={generating || saving} className="btn-secondary btn-sm border-accent-500/40 text-accent-300 hover:bg-accent-500/10">
              {generating ? 'Зарежда...' : '✨ Генерирай с AI'}
            </button>
          </div>
          <textarea
            id="sf-description"
            rows={5}
            maxLength={2000}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Опиши услугата или натисни „Генерирай с AI“"
            className={`input resize-y ${errors.description ? 'input-error' : ''}`}
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            {errors.description ? <p className="field-error mt-0">{errors.description}</p> : <span />}
            <span>{form.description.length}/2000</span>
          </div>
          {aiFeedback && <InlineFeedback type={aiFeedback.type} message={aiFeedback.message} className="mt-2" onClose={() => setAiFeedback(null)} />}
        </div>

        <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label={form.isActive ? 'Активна – вижда се от клиентите' : 'Неактивна – скрита от клиентите'} />
      </form>
    </Modal>
  );
}

/* =========================================================================
 *  STAFF FORM
 * ========================================================================= */
interface StaffForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  position: string;
  bio: string;
  services: string[];
  workingDays: number[];
  workStart: string;
  workEnd: string;
  isActive: boolean;
}

const EMPTY_STAFF: StaffForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  position: '',
  bio: '',
  services: [],
  workingDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '18:00',
  isActive: true,
};

const validateStaff = (f: StaffForm, isEdit: boolean): FieldErrors => {
  const e: FieldErrors = {};
  if (f.name.trim().length < 2) e.name = 'Името трябва да е поне 2 символа';
  if (!EMAIL_REGEX.test(f.email.trim())) e.email = 'Въведи валиден имейл адрес';
  if (!isEdit && f.password.length < 6) e.password = 'Паролата трябва да е поне 6 символа';
  if (isEdit && f.password && f.password.length < 6) e.password = 'Паролата трябва да е поне 6 символа';
  if (f.phone.trim() && !PHONE_REGEX.test(f.phone.trim())) e.phone = 'Въведи валиден телефонен номер';
  if (!f.workingDays.length) e.workingDays = 'Избери поне един работен ден';
  if (f.workEnd <= f.workStart) e.workEnd = 'Краят трябва да е след началото';
  return e;
};

interface StaffFormModalProps {
  open: boolean;
  member: StaffMember | null;
  services: Service[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

function StaffFormModal({ open, member, services, onClose, onSaved }: StaffFormModalProps) {
  const isEdit = Boolean(member);
  const [form, setForm] = useState<StaffForm>(EMPTY_STAFF);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFeedback(null);
    setForm(
      member
        ? {
            name: member.name,
            email: member.email || '',
            phone: member.phone || '',
            password: '',
            position: member.position || '',
            bio: member.bio || '',
            services: (member.services || []).map((s) => s._id),
            workingDays: member.workingDays || [],
            workStart: member.workStart || '09:00',
            workEnd: member.workEnd || '18:00',
            isActive: member.isActive !== false,
          }
        : EMPTY_STAFF
    );
  }, [open, member]);

  const set = <K extends keyof StaffForm>(name: K, value: StaffForm[K]) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const toggleDay = (day: number) => set('workingDays', form.workingDays.includes(day) ? form.workingDays.filter((d) => d !== day) : [...form.workingDays, day]);
  const toggleService = (id: string) => set('services', form.services.includes(id) ? form.services.filter((s) => s !== id) : [...form.services, id]);

  const blur = (name: keyof StaffForm) => {
    const e = validateStaff(form, isEdit);
    if (form[name] && e[name]) setErrors((er) => ({ ...er, [name]: e[name] }));
  };

  const submit = async (ev?: FormEvent) => {
    ev?.preventDefault();
    const e = validateStaff(form, isEdit);
    setErrors(e);
    if (Object.keys(e).length) {
      setFeedback({ type: 'error', message: 'Моля, попълни правилно отбелязаните полета.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      position: form.position.trim(),
      bio: form.bio.trim(),
      services: form.services,
      workingDays: form.workingDays,
      workStart: form.workStart,
      workEnd: form.workEnd,
      isActive: form.isActive,
    };
    if (form.password) payload.password = form.password;
    try {
      const res = member ? await api.put<ApiResponse<StaffMember>>(`/staff/${member._id}`, payload) : await api.post<ApiResponse<StaffMember>>('/staff', payload);
      onSaved(res.data.message);
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors });
      setErrors(getFieldErrors(fb.errors));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Редактирай служител' : 'Нов служител'}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Отказ
          </button>
          <button type="button" className="btn-primary" onClick={() => submit()} disabled={saving}>
            {saving ? 'Зарежда...' : isEdit ? 'Запази промените' : 'Добави служителя'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <InlineFeedback type={feedback?.type} message={feedback?.message} errors={feedback?.errors} onClose={() => setFeedback(null)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="st-name" label="Име" error={errors.name}>
            <input id="st-name" value={form.name} onChange={(e) => set('name', e.target.value)} onBlur={() => blur('name')} maxLength={60} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Георги Петров" />
          </Field>
          <Field id="st-position" label="Позиция" error={errors.position}>
            <input id="st-position" value={form.position} onChange={(e) => set('position', e.target.value)} maxLength={60} className="input" placeholder="Барбър, Стилист..." />
          </Field>
          <Field id="st-email" label="Имейл (за вход)" error={errors.email}>
            <input id="st-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} onBlur={() => blur('email')} className={`input ${errors.email ? 'input-error' : ''}`} placeholder="ime@primer.bg" />
          </Field>
          <Field id="st-phone" label="Телефон" error={errors.phone}>
            <input id="st-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} onBlur={() => blur('phone')} className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="+359..." />
          </Field>
          <Field id="st-password" label={isEdit ? 'Нова парола (по желание)' : 'Парола'} error={errors.password} hint={isEdit ? 'Остави празно, за да не я променяш.' : undefined}>
            <input
              id="st-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              onBlur={() => blur('password')}
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="Поне 6 символа"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <CustomDropdown label="Начало" options={TIME_OPTIONS} value={form.workStart} onChange={(v) => set('workStart', v || '09:00')} error={errors.workStart} />
            <CustomDropdown label="Край" options={TIME_OPTIONS} value={form.workEnd} onChange={(v) => set('workEnd', v || '18:00')} error={errors.workEnd} />
          </div>
        </div>

        <div>
          <p className="label">Работни дни</p>
          <div className="flex flex-wrap gap-2">
            {WEEK_ORDER.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                aria-pressed={form.workingDays.includes(d)}
                className={`h-10 w-12 rounded-xl border text-sm font-semibold transition ${
                  form.workingDays.includes(d) ? 'border-brand-500 bg-brand-600 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'
                }`}
              >
                {WEEKDAYS_SHORT_BY_INDEX[d]}
              </button>
            ))}
          </div>
          {errors.workingDays && <p className="field-error">{errors.workingDays}</p>}
        </div>

        <div>
          <p className="label">Услуги, които предлага</p>
          <p className="mb-2 text-xs text-slate-500">Ако не избереш нищо, служителят предлага всички услуги.</p>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => toggleService(s._id)}
                aria-pressed={form.services.includes(s._id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  form.services.includes(s._id) ? 'border-accent-500 bg-accent-600/20 text-accent-200' : 'border-white/10 text-slate-400 hover:border-white/25'
                }`}
              >
                {form.services.includes(s._id) ? '✓ ' : ''}
                {s.title}
              </button>
            ))}
            {services.length === 0 && <p className="text-sm text-slate-500">Все още няма услуги.</p>}
          </div>
          {errors.services && <p className="field-error">{errors.services}</p>}
        </div>

        <Field id="st-bio" label="Кратко описание" error={errors.bio}>
          <textarea id="st-bio" rows={2} maxLength={500} value={form.bio} onChange={(e) => set('bio', e.target.value)} className="input resize-none" placeholder="Опит, специалност..." />
        </Field>

        <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label={form.isActive ? 'Активен – приема резервации' : 'Неактивен – не приема резервации'} />
      </form>
    </Modal>
  );
}

/* =========================================================================
 *  PAGE
 * ========================================================================= */
type Tab = 'services' | 'staff';
type ConfirmState = { kind: 'service'; item: Service } | { kind: 'staff'; item: StaffMember };

export default function AdminServices() {
  const [tab, setTab] = useState<Tab>('services');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [reload, setReload] = useState(0);
  const debouncedSearch = useDebounce(search, 400);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState('');
  const [allServices, setAllServices] = useState<Service[]>([]);

  const [serviceModal, setServiceModal] = useState<{ open: boolean; item: Service | null }>({ open: false, item: null });
  const [staffModal, setStaffModal] = useState<{ open: boolean; item: StaffMember | null }>({ open: false, item: null });
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const refresh = useCallback(() => setReload((r) => r + 1), []);

  useEffect(() => setPage(1), [debouncedSearch, category, sort]);

  useEffect(() => {
    api
      .get<ApiResponse<string[]>>('/services/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]));
    api
      .get<ApiResponse<Service[]>>('/services', { params: { limit: 100, sort: 'title_asc', includeInactive: 'true' } })
      .then((res) => setAllServices(res.data.data || []))
      .catch(() => setAllServices([]));
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setListError('');
    api
      .get<ApiResponse<Service[]>>('/services', {
        params: { page, limit: 8, search: debouncedSearch || undefined, category: category || undefined, sort, includeInactive: 'true' },
      })
      .then((res) => {
        if (cancelled) return;
        setServices(res.data.data || []);
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
  }, [page, debouncedSearch, category, sort, reload]);

  useEffect(() => {
    let cancelled = false;
    setStaffLoading(true);
    setStaffError('');
    api
      .get<ApiResponse<StaffMember[]>>('/staff', { params: { all: 'true' } })
      .then((res) => {
        if (!cancelled) setStaff(res.data.data || []);
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
  }, [reload]);

  const onSaved = (message: string) => {
    setServiceModal({ open: false, item: null });
    setStaffModal({ open: false, item: null });
    setFeedback({ type: 'success', message });
    refresh();
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    setConfirmError('');
    try {
      const url = confirm.kind === 'service' ? `/services/${confirm.item._id}` : `/staff/${confirm.item._id}`;
      const res = await api.delete<ApiResponse<{ _id: string }>>(url);
      setFeedback({ type: 'success', message: res.data.message });
      if (confirm.kind === 'service' && services.length === 1 && page > 1) setPage((p) => p - 1);
      setConfirm(null);
      refresh();
    } catch (err) {
      setConfirmError(getErrorFeedback(err).message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const closeServiceModal = useCallback(() => setServiceModal({ open: false, item: null }), []);
  const closeStaffModal = useCallback(() => setStaffModal({ open: false, item: null }), []);
  const closeConfirm = useCallback(() => {
    if (!confirmLoading) setConfirm(null);
  }, [confirmLoading]);

  const hasFilters = Boolean(search || category);

  return (
    <div>
      <PageHeader
        eyebrow="Администрация"
        title="Управление"
        subtitle="Добавяй услуги, бръснари и работно време."
        image={BARBER_IMAGES.tools}
        actions={
          <button
            type="button"
            className="btn-accent"
            onClick={() => (tab === 'services' ? setServiceModal({ open: true, item: null }) : setStaffModal({ open: true, item: null }))}
          >
            {tab === 'services' ? '+ Нова услуга' : '+ Нов служител'}
          </button>
        }
      />

      <div className="container-page">
        <div className="relative z-10 -mt-6 inline-flex rounded-xl border border-white/10 bg-ink-800 p-1 shadow-soft" role="tablist" aria-label="Секции">
          {(
            [
              ['services', `Услуги (${meta.total || 0})`],
              ['staff', `Служители (${staff.length})`],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                setFeedback(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${tab === key ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {feedback && <InlineFeedback type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} className="mt-6" />}

        {tab === 'services' && (
          <section className="mt-6" aria-label="Услуги">
            <div className="card grid gap-3 p-4 md:grid-cols-[1fr_200px_200px]">
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси услуга..." className="input" aria-label="Търси услуга" />
              <CustomDropdown options={categories.map((c) => ({ value: c, label: c }))} value={category} onChange={(v) => setCategory(v)} placeholder="Всички категории" clearable />
              <CustomDropdown options={SORT_OPTIONS} value={sort} onChange={(v) => setSort(v || 'newest')} searchable={false} />
            </div>

            <div className="mt-4">
              {loading && <SkeletonList count={4} />}
              {!loading && listError && (
                <InlineFeedback type="error" message={listError}>
                  <button type="button" onClick={refresh} className="mt-2 text-sm font-semibold underline">
                    Опитай отново
                  </button>
                </InlineFeedback>
              )}
              {!loading && !listError && services.length === 0 && (
                <EmptyState
                  description={hasFilters ? 'Няма услуги по тези критерии.' : 'Добави първата си услуга – отнема по-малко от минута.'}
                  actionLabel={hasFilters ? 'Изчисти филтрите' : '+ Нова услуга'}
                  onAction={
                    hasFilters
                      ? () => {
                          setSearch('');
                          setCategory('');
                        }
                      : () => setServiceModal({ open: true, item: null })
                  }
                />
              )}
              {!loading && !listError && services.length > 0 && (
                <div className="space-y-3">
                  {services.map((s) => (
                    <article key={s._id} className="card flex flex-col gap-4 p-4 transition hover:border-white/20 sm:flex-row sm:items-center">
                      <ServiceImage service={s} className="h-16 w-full shrink-0 rounded-xl sm:w-24" compact />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-white">{s.title}</h3>
                          <span className="badge bg-white/10 text-slate-300">{s.category}</span>
                          {!s.isActive && <span className="badge bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">Неактивна</span>}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-400">
                          <span className="text-accent-400">{formatPrice(s.price)}</span> · {formatDuration(s.duration)}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{s.description || 'Без описание'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="btn-secondary btn-sm" onClick={() => setServiceModal({ open: true, item: s })}>
                          Редактирай
                        </button>
                        <button
                          type="button"
                          className="btn-ghost btn-sm text-accent-400 hover:bg-accent-500/10"
                          onClick={() => {
                            setConfirmError('');
                            setConfirm({ kind: 'service', item: s });
                          }}
                        >
                          Изтрий
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} disabled={loading} />
            </div>
          </section>
        )}

        {tab === 'staff' && (
          <section className="mt-6" aria-label="Служители">
            {staffLoading && <SkeletonList count={3} />}
            {!staffLoading && staffError && <InlineFeedback type="error" message={staffError} />}
            {!staffLoading && !staffError && staff.length === 0 && (
              <EmptyState description="Добави първия член на екипа, за да могат клиентите да резервират." actionLabel="+ Нов служител" onAction={() => setStaffModal({ open: true, item: null })} />
            )}
            {!staffLoading && !staffError && staff.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {staff.map((m, i) => (
                  <article key={m._id} className="card flex flex-col p-5 transition hover:border-white/20">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-xl font-bold text-white ring-2 ring-white/10 ${
                          i % 2 ? 'bg-gradient-to-br from-accent-600 to-accent-800' : 'bg-gradient-to-br from-brand-600 to-brand-800'
                        }`}
                      >
                        {m.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-white">{m.name}</h3>
                          {!m.isActive && <span className="badge bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">Неактивен</span>}
                        </div>
                        <p className="text-sm text-slate-400">{m.position || 'Служител'}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1 text-sm text-slate-300">
                      <p>
                        🕘 {m.workStart} – {m.workEnd} ·{' '}
                        {WEEK_ORDER.filter((d) => m.workingDays?.includes(d))
                          .map((d) => WEEKDAYS_SHORT_BY_INDEX[d])
                          .join(', ') || 'няма дни'}
                      </p>
                      <p className="line-clamp-2">✂️ {m.services?.length ? m.services.map((s) => s.title).join(', ') : 'Всички услуги'}</p>
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setStaffModal({ open: true, item: m })}>
                        Редактирай
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm text-accent-400 hover:bg-accent-500/10"
                        onClick={() => {
                          setConfirmError('');
                          setConfirm({ kind: 'staff', item: m });
                        }}
                      >
                        Изтрий
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <ServiceFormModal open={serviceModal.open} service={serviceModal.item} categories={categories} onClose={closeServiceModal} onSaved={onSaved} />
      <StaffFormModal open={staffModal.open} member={staffModal.item} services={allServices} onClose={closeStaffModal} onSaved={onSaved} />

      <ConfirmModal
        open={Boolean(confirm)}
        title="Сигурен ли си?"
        message={
          confirm?.kind === 'service'
            ? `Услугата „${confirm.item.title}“ ще бъде изтрита завинаги.`
            : `${confirm?.item.name} ще бъде премахнат(а) от екипа и няма да може да влиза.`
        }
        confirmText="Изтрий"
        cancelText="Отказ"
        loading={confirmLoading}
        error={confirmError}
        onConfirm={handleDelete}
        onCancel={closeConfirm}
      />
    </div>
  );
}
