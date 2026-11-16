import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorFeedback, getFieldErrors } from '../api/axios.js';
import InlineFeedback from '../components/InlineFeedback.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { isValidEmail } from '../utils/format.js';

const validateField = (name, value) => {
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

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
    if (feedback?.type === 'error') setFeedback(null);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (value) setErrors((er) => ({ ...er, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = { email: validateField('email', form.email), password: validateField('password', form.password) };
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
    <div className="container-page flex min-h-[75vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Добре дошъл отново 👋</h1>
          <p className="mt-1 text-sm text-slate-500">Влез в профила си, за да управляваш резервациите си.</p>
        </div>

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
            {errors.email && <p id="email-error" className="field-error">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="label">
              Парола
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Поне 6 символа"
              error={errors.password}
              disabled={loading}
            />
            {errors.password && <p id="password-error" className="field-error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Зарежда...' : 'Вход'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Нямаш профил?{' '}
          <Link to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-brand-600 hover:underline">
            Регистрирай се
          </Link>
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
          Демо администратор: <span className="font-mono font-semibold">admin@test.com</span> / <span className="font-mono font-semibold">123456</span>
        </div>
      </div>
    </div>
  );
}
