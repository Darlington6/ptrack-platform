import { useNavigate } from 'react-router-dom';
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
  const { t } = useTranslation('terms');

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-slate-400">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">{t('effective_date')}</p>
        </div>
      </div>

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
          <a href="mailto:support@ptrack.rw" className="text-green-600 dark:text-green-400">
            support@ptrack.rw
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
          <a href="mailto:support@ptrack.rw" className="text-green-600 dark:text-green-400">
            support@ptrack.rw
          </a>
          .
        </p>
      </Section>

      <p className="text-xs text-gray-400 dark:text-slate-400 text-center pt-2">
        {t('copyright', { year: new Date().getFullYear() })}
      </p>
    </div>
  );
}