import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorFeedback, getFieldErrors } from '../api/axios';
import InlineFeedback from '../components/InlineFeedback';
import PasswordInput from '../components/PasswordInput';
import AuthLayout from '../components/AuthLayout';
import { isValidEmail } from '../utils/format';
import { BARBER_IMAGES } from '../utils/images';
import type { Feedback, FieldErrors } from '../types';

type LoginField = 'email' | 'password';

const validateField = (name: LoginField, value: string): string => {
  if (name === 'email') {
    if (!value.trim()) return 'Имейлът е задължителен';
    if (!isValidEmail(value)) return 'Въведи валиден имейл адрес';
  }
  if (name === 'password') {
    if (!value) return 'Паролата е задължителна';
    if (value.length < 6) return 'Паролата трябва да е поне 6 символа';
  }
  return '';
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [form, setForm] = useState<Record<LoginField, string>>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as LoginField;
    setForm((f) => ({ ...f, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
    if (feedback?.type === 'error') setFeedback(null);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as LoginField;
    if (e.target.value) setErrors((er) => ({ ...er, [name]: validateField(name, e.target.value) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: FieldErrors = { email: validateField('email', form.email), password: validateField('password', form.password) };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setFeedback({ type: 'error', message: 'Моля, попълни правилно отбелязаните полета.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const data = await login({ email: form.email.trim(), password: form.password });
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

  return (
    <AuthLayout title="Добре дошъл отново" subtitle="Влез в профила си, за да управляваш резервациите си." image={BARBER_IMAGES.cut} quote="Добрата прическа започва с точния час.">
      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <InlineFeedback type={feedback?.type} message={feedback?.message} errors={feedback?.errors} onClose={() => setFeedback(null)} />

        <div>
          <label htmlFor="email" className="label">
            Имейл
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="ime@primer.bg"
            autoComplete="email"
            disabled={loading}
            aria-invalid={Boolean(errors.email)}
            className={`input ${errors.email ? 'input-error' : ''}`}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="label">
            Парола
          </label>
          <PasswordInput id="password" name="password" value={form.password} onChange={handleChange} onBlur={handleBlur} placeholder="Поне 6 символа" error={errors.password} disabled={loading} />
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        <button type="submit" className="btn-primary w-full py-3 uppercase tracking-wider" disabled={loading}>
          {loading ? 'Зарежда...' : 'Вход'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Нямаш профил?{' '}
        <Link to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-accent-400 hover:underline">
          Регистрирай се
        </Link>
      </p>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-3 text-center text-xs text-slate-400">
        Демо администратор: <span className="font-mono font-semibold text-white">admin@test.com</span> / <span className="font-mono font-semibold text-white">123456</span>
      </div>
    </AuthLayout>
  );
}
