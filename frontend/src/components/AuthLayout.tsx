import type { ReactNode } from 'react';
import SafeImage from './SafeImage';
import BarberPole from './BarberPole';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  image: string;
  quote: string;
  children: ReactNode;
}

/** Split layout for Login / Register: form + barber photo. */
export default function AuthLayout({ title, subtitle, image, quote, children }: AuthLayoutProps) {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="card grid overflow-hidden lg:grid-cols-2">
        <div className="relative hidden min-h-[560px] lg:block">
          <SafeImage src={image} alt="Бръснарница" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-brand-900/30" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 right-0 flex items-end gap-5 p-8">
            <BarberPole height={90} width={26} />
            <p className="font-display text-2xl font-semibold uppercase leading-snug tracking-wide text-white">{quote}</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="barber-stripes mb-6 h-1 w-16 rounded-full" aria-hidden="true" />
            <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-white">{title}</h1>
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
