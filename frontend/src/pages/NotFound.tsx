import { Link, useNavigate } from 'react-router-dom';
import BarberPole from '../components/BarberPole';

export default function NotFound() {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <section className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="relative w-full max-w-xl text-center">
        <div className="absolute inset-x-0 top-6 -z-10 mx-auto h-48 w-72 rounded-full bg-brand-600/20 blur-3xl" aria-hidden="true" />
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <span className="font-display text-[7rem] font-bold leading-none text-brand-500 sm:text-[10rem]">4</span>
          <BarberPole height={110} width={34} />
          <span className="font-display text-[7rem] font-bold leading-none text-accent-500 sm:text-[10rem]">4</span>
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold uppercase tracking-wide text-white sm:text-4xl">Опа! Тази страница не съществува</h1>
        <p className="mx-auto mt-3 max-w-md text-slate-400">Може би си сбъркал адреса или страницата е преместена.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn-primary px-6 py-3">
            Към началото
          </Link>
          <button type="button" onClick={goBack} className="btn-secondary px-6 py-3">
            Назад
          </button>
        </div>
      </div>
    </section>
  );
}
