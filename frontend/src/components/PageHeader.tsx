import type { ReactNode } from 'react';
import SafeImage from './SafeImage';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: string;
  actions?: ReactNode;
}

/** Dark banner with a barber photo used at the top of inner pages. */
export default function PageHeader({ eyebrow, title, subtitle, image, actions }: PageHeaderProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/10">
      <SafeImage src={image} alt="" className="absolute inset-0 -z-20 h-full w-full" />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-ink-950 via-ink-950/90 to-ink-950/50" aria-hidden="true" />
      <div className="container-page flex flex-col justify-between gap-6 pb-16 pt-12 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="section-title mt-3">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-300">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}
