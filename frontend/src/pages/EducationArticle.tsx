import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { educationApi } from '../api/endpoints/education';
import { Spinner } from '../components/ui/Spinner';
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
        <Spinner size="lg" />
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
        <div className="w-full bg-gray-100 dark:bg-slate-800">
          <img src={article.cover_image} alt={title} className="w-full h-auto block" />
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
            {article.category
              .split('_')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')}
          </span>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-1 leading-snug">
            {title}
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 flex items-center gap-1">
            <Clock size={11} /> {article.reading_time_minutes} min read
            {article.published_at && ` · ${new Date(article.published_at).toLocaleDateString()}`}
          </p>
        </div>

        <div className="text-gray-700 dark:text-slate-300 leading-relaxed space-y-3 [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a]:hover:text-blue-300 [&_strong]:font-bold [&_strong]:text-gray-900 dark:[&_strong]:text-white [&_em]:italic [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 dark:[&_h1]:text-white [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 dark:[&_h2]:text-white [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-800 dark:[&_h3]:text-slate-100 [&_h3]:mt-4 [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-green-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500 dark:[&_blockquote]:text-slate-400 [&_code]:bg-gray-100 dark:[&_code]:bg-slate-700 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm [&_pre]:bg-gray-100 dark:[&_pre]:bg-slate-800 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_hr]:border-gray-200 dark:[&_hr]:border-slate-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
