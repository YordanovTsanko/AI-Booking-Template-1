import { useEffect, useState } from 'react';
import api, { getErrorFeedback } from '../api/axios.js';
import useDebounce from '../hooks/useDebounce.js';
import CustomDropdown from '../components/CustomDropdown.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import InlineFeedback from '../components/InlineFeedback.jsx';
import Pagination from '../components/Pagination.jsx';
import { SkeletonGrid } from '../components/Skeleton.jsx';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Най-нови' },
  { value: 'price_asc', label: 'Цена: ниска → висока' },
  { value: 'price_desc', label: 'Цена: висока → ниска' },
  { value: 'duration_asc', label: 'Времетраене: кратко → дълго' },
  { value: 'duration_desc', label: 'Времетраене: дълго → кратко' },
  { value: 'title_asc', label: 'Име (А → Я)' },
];

export default function Services() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    api
      .get('/services/categories')
      .then((res) => setCategories((res.data.data || []).map((c) => ({ value: c, label: c }))))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => setPage(1), [debouncedSearch, category, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get('/services', { params: { page, limit: 9, search: debouncedSearch || undefined, category: category || undefined, sort } })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.data || []);
        setMeta(res.data.meta || { totalPages: 1, total: 0 });
      })
      .catch((err) => !cancelled && setError(getErrorFeedback(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, category, sort, reloadKey]);

  const hasFilters = Boolean(search || category);

  return (
    <div className="container-page py-10">
      <div className="max-w-2xl">
        <h1 className="section-title">Нашите услуги</h1>
        <p className="mt-2 text-slate-500">Намери точната услуга за теб и запази час онлайн за секунди.</p>
      </div>

      <div className="card mt-8 grid gap-3 p-4 md:grid-cols-[1fr_220px_260px]">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a.75.75 0 11-1.06 1.06l-3.08-3.08A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Търси услуга по име..."
            className="input pl-9"
            aria-label="Търси услуга"
            maxLength={100}
          />
        </div>
        <CustomDropdown options={categories} value={category} onChange={setCategory} placeholder="Всички категории" clearable searchPlaceholder="Търси категория..." />
        <CustomDropdown options={SORT_OPTIONS} value={sort} onChange={(v) => setSort(v || 'newest')} placeholder="Подреди по" searchable={false} />
      </div>

      <div className="mt-8">
        {loading && <SkeletonGrid count={6} />}

        {!loading && error && (
          <InlineFeedback type="error" message={error}>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="mt-2 text-sm font-semibold underline">
              Опитай отново
            </button>
          </InlineFeedback>
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={hasFilters ? 'Няма услуги по тези критерии' : 'Все още няма нищо тук'}
            description={hasFilters ? 'Пробвай с друга дума или изчисти филтрите.' : 'Все още няма добавени услуги.'}
            actionLabel={hasFilters ? 'Изчисти филтрите' : 'Към началото'}
            onAction={hasFilters ? () => { setSearch(''); setCategory(''); } : undefined}
            actionTo={hasFilters ? undefined : '/'}
          />
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} disabled={loading} />
      </div>
    </div>
  );
}
