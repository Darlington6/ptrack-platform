import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { educationApi } from '../api/endpoints/education';
import type { Article } from '../api/types';

export default function EducationArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = (i18n.language?.startsWith('rw') ? 'rw' : 'en') as 'en' | 'rw';
  const [readPct, setReadPct] = useState(0);
  const articleRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['education', 'article', slug],
    queryFn: () => educationApi.detail(slug ?? ''),
    enabled: !!slug,
    staleTime: 30 * 60_000,
  });

  const article: Article | undefined = data?.data;

  // Reading progress bar
  useEffect(() => {
    function onScroll() {
      const el = articleRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const pct = Math.min(100, Math.max(0, (-top / (height - window.innerHeight)) * 100));
      setReadPct(pct);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-slate-400">Article not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-green-600 font-medium text-sm">
          Go back
        </button>
      </div>
    );
  }

  const title = lang === 'rw' && article.title_rw ? article.title_rw : article.title_en;
  const body = lang === 'rw' && article.body_rw ? article.body_rw : (article.body_en ?? '');

  function share() {
    if (navigator.share) {
      void navigator.share({ title, url: window.location.href });
    } else {
      void navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <div className="pb-24" ref={articleRef}>
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-green-600 z-50 transition-all"
        style={{ width: `${readPct}%` }}
      />

      {article.cover_image && (
        <div className="w-full h-52 overflow-hidden">
          <img src={article.cover_image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={share}
            className="flex items-center gap-1.5 text-sm text-green-600"
            aria-label="Share article"
          >
            <Share2 size={14} /> Share
          </button>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
            {article.category}
          </span>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-1 leading-snug">
            {title}
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 flex items-center gap-1">
            <Clock size={11} /> {article.reading_time_minutes} min read
            {article.published_at && ` · ${new Date(article.published_at).toLocaleDateString()}`}
          </p>
        </div>

        <div
          className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-slate-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </div>
    </div>
  );
}
