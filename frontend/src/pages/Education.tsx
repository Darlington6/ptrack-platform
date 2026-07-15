import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, ArrowLeft, Newspaper } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { educationApi } from '../api/endpoints/education';
import type { Article } from '../api/types';

function ArticleCard({ article, lang }: { article: Article; lang: 'en' | 'rw' }) {
  const { t } = useTranslation('education');
  const title = lang === 'rw' && article.title_rw ? article.title_rw : article.title_en;

  return (
    <Link
      to={`/education/${article.slug}`}
      className="flex gap-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
    >
      {article.cover_image ? (
        <img
          src={article.cover_image}
          alt={title}
          className="w-24 self-stretch object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
          <Newspaper size={36} className="text-green-600 dark:text-green-400" />
        </div>
      )}
      <div className="flex-1 p-3 min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
          {t(`cat_${article.category}`)}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 flex items-center gap-1">
          <Clock size={10} /> {t('min_read', { count: article.reading_time_minutes })}
        </p>
      </div>
    </Link>
  );
}

export default function Education() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('education');
  const lang = (i18n.language?.startsWith('rw') ? 'rw' : 'en') as 'en' | 'rw';
  const [category, setCategory] = useState('All');

  const CATEGORIES: { value: string; label: string }[] = [
    { value: 'All', label: t('cat_all') },
    { value: 'recycling', label: t('cat_recycling') },
    { value: 'waste_reduction', label: t('cat_waste_reduction') },
    { value: 'climate', label: t('cat_climate') },
    { value: 'policy', label: t('cat_policy') },
    { value: 'community', label: t('cat_community') },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['education', category],
    queryFn: () => educationApi.list(category !== 'All' ? { category } : undefined),
    staleTime: 10 * 60_000,
  });

  const articles: Article[] = data?.data?.results ?? (data?.data as unknown as Article[]) ?? [];

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              category === c.value
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && articles.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400 text-sm">
          {t('no_articles')}
        </div>
      )}

      <div className="space-y-3">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} lang={lang} />
        ))}
      </div>
    </div>
  );
}