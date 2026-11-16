import { useState, type ChangeEvent, type FocusEvent, type FormEvent, type InputHTMLAttributes } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorFeedback, getFieldErrors } from '../api/axios';
import InlineFeedback from '../components/InlineFeedback';
import PasswordInput from '../components/PasswordInput';
import AuthLayout from '../components/AuthLayout';
import { isValidEmail } from '../utils/format';
import { BARBER_IMAGES } from '../utils/images';
import type { Feedback, FieldErrors } from '../types';

const PHONE_REGEX = /^[+\d\s()-]{6,20}$/;

type RegisterField = 'name' | 'email' | 'phone' | 'password' | 'confirmPassword';
type RegisterForm = Record<RegisterField, string>;

const FIELDS: RegisterField[] = ['name', 'email', 'phone', 'password', 'confirmPassword'];

const validateField = (name: RegisterField, value: string, form: RegisterForm): string => {
  switch (name) {
    case 'name':
      if (!value.trim()) return 'Името е задължително';
      if (value.trim().length < 2) return 'Името трябва да е поне 2 символа';
      if (value.trim().length > 60) return 'Името може да е най-много 60 символа';
      return '';
    case 'email':
      if (!value.trim()) return 'Имейлът е задължителен';
      return isValidEmail(value) ? '' : 'Въведи валиден имейл адрес';
    case 'phone':
      return value.trim() && !PHONE_REGEX.test(value.trim()) ? 'Въведи валиден телефонен номер' : '';
    case 'password':
      if (!value) return 'Паролата е задължителна';
      return value.length < 6 ? 'Паролата трябва да е поне 6 символа' : '';
    case 'confirmPassword':
      if (!value) return 'Повтори паролата';
      return value !== form.password ? 'Паролите не съвпадат' : '';
    default:
      return '';
  }
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [form, setForm] = useState<RegisterForm>({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as RegisterField;
    setForm((f) => ({ ...f, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
    if (feedback?.type === 'error') setFeedback(null);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as RegisterField;
    if (e.target.value) setErrors((er) => ({ ...er, [name]: validateField(name, e.target.value, form) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: FieldErrors = Object.fromEntries(FIELDS.map((f) => [f, validateField(f, form[f], form)]));
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setFeedback({ type: 'error', message: 'Моля, попълни правилно отбелязаните полета.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const data = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      const target = redirect && redirect.startsWith('/') ? redirect : '/dashboard';
      navigate(target, { replace: true, state: { flash: { type: 'success', message: data.message } } });
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors });
      setErrors(getFieldErrors(fb.errors));
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (name: RegisterField, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={form[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={loading}
        aria-invalid={Boolean(errors[name])}
        className={`input ${errors[name] ? 'input-error' : ''}`}
        {...props}
      />
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );

  return (
    <AuthLayout title="Създай профил" subtitle="Регистрирай се и запазвай часове за секунди." image={BARBER_IMAGES.beard} quote="Твоят стол те чака. Без опашки.">
      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        <InlineFeedback type={feedback?.type} message={feedback?.message} errors={feedback?.errors} onClose={() => setFeedback(null)} />

        {renderInput('name', 'Име и фамилия', { placeholder: 'Иван Иванов', autoComplete: 'name', maxLength: 60 })}
        {renderInput('email', 'Имейл', { type: 'email', placeholder: 'ime@primer.bg', autoComplete: 'email' })}
        {renderInput('phone', 'Телефон (по желание)', { type: 'tel', placeholder: '+359 888 123 456', autoComplete: 'tel' })}

        <div>
          <label htmlFor="password" className="label">
            Парола
          </label>
          <PasswordInput id="password" name="password" value={form.password} onChange={handleChange} onBlur={handleBlur} placeholder="Поне 6 символа" autoComplete="new-password" error={errors.password} disabled={loading} />
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Повтори паролата
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Същата парола"
            autoComplete="new-password"
            error={errors.confirmPassword}
            disabled={loading}
          />
          {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
        </div>

        <button type="submit" className="btn-accent w-full py-3 uppercase tracking-wider" disabled={loading}>
          {loading ? 'Зарежда...' : 'Регистрация'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Вече имаш профил?{' '}
        <Link to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-brand-400 hover:underline">
          Влез
        </Link>
      </p>
    </AuthLayout>
  );
}
