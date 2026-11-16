import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <section className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="relative w-full max-w-xl text-center">
        <div className="absolute inset-x-0 top-6 -z-10 mx-auto h-48 w-48 rounded-full bg-brand-200/50 blur-3xl" aria-hidden="true" />
        <p className="bg-gradient-to-br from-brand-600 via-purple-600 to-pink-500 bg-clip-text text-[8rem] font-black leading-none tracking-tighter text-transparent sm:text-[11rem]">
          404
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">Опа! Тази страница не съществува</h1>
        <p className="mx-auto mt-3 max-w-md text-slate-500">Може би си сбъркал адреса или страницата е преместена.</p>
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
