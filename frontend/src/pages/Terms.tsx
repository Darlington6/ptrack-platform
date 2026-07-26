// i18n-ready: see src/locales/{en,rw}/
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      <div className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

export default function Terms() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('terms');

  const fromRegister = (location.state as { from?: string } | null)?.from === 'register';

  function goBack() {
    if (fromRegister) navigate('/register');
    else navigate(-1);
  }

  const sections = (
    <>
      <Section title={t('s1_title')}>
        <p>{t('s1_body')}</p>
      </Section>

      <Section title={t('s2_title')}>
        <p>{t('s2_body')}</p>
      </Section>

      <Section title={t('s3_title')}>
        <p>{t('s3_intro')}</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          {(['s3_li1', 's3_li2', 's3_li3', 's3_li4', 's3_li5'] as const).map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
        <p>{t('s3_footer')}</p>
      </Section>

      <Section title={t('s4_title')}>
        <p>
          {t('s4_body_pre')}{' '}
          <a href="mailto:d.tunyinko@alustudent.com" className="text-green-600 dark:text-green-400">
            d.tunyinko@alustudent.com
          </a>{' '}
          {t('s4_body_post')}
        </p>
      </Section>

      <Section title={t('s5_title')}>
        <p>{t('s5_body1')}</p>
        <p>{t('s5_body2')}</p>
      </Section>

      <Section title={t('s6_title')}>
        <p>{t('s6_body1')}</p>
        <p>{t('s6_body2')}</p>
      </Section>

      <Section title={t('s7_title')}>
        <p>{t('s7_body')}</p>
      </Section>

      <Section title={t('s8_title')}>
        <p>{t('s8_body')}</p>
      </Section>

      <Section title={t('s9_title')}>
        <p>{t('s9_body')}</p>
      </Section>

      <Section title={t('s10_title')}>
        <p>
          {t('s10_body')}{' '}
          <a href="mailto:d.tunyinko@alustudent.com" className="text-green-600 dark:text-green-400">
            d.tunyinko@alustudent.com
          </a>
          .
        </p>
      </Section>

      <p className="text-xs text-gray-400 dark:text-slate-400 text-center pt-2">
        {t('copyright', { year: new Date().getFullYear() })}
      </p>
    </>
  );

  if (fromRegister) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
        {/* Sticky header */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-slate-700">
          <button
            onClick={goBack}
            aria-label="Go back"
            className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-xs text-gray-400 dark:text-slate-500">{t('effective_date')}</p>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-lg w-full mx-auto">
          {sections}
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-gray-100 dark:border-slate-700 px-4 py-3 flex justify-end bg-white dark:bg-slate-900">
          <button
            onClick={goBack}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {t('i_understand')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="text-gray-500 dark:text-slate-400">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">{t('effective_date')}</p>
        </div>
      </div>

      {sections}
    </div>
  );
}
// ----
