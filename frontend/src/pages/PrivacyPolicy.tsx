// i18n-ready: see src/locales/{en,rw}/
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

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { t } = useTranslation('privacy');

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
        <p>{t('s1_body1')}</p>
        <p>{t('s1_body2')}</p>
      </Section>

      <Section title={t('s2_title')}>
        <p>
          <strong>{t('s2_account_label')}</strong> {t('s2_account_body')}
        </p>
        <p>
          <strong>{t('s2_activity_label')}</strong> {t('s2_activity_body')}
        </p>
        <p>
          <strong>{t('s2_technical_label')}</strong> {t('s2_technical_body')}
        </p>
        <p>
          <strong>{t('s2_prefs_label')}</strong> {t('s2_prefs_body')}
        </p>
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
        <p>{t('s4_body1')}</p>
        <p>{t('s4_body2')}</p>
      </Section>

      <Section title={t('s5_title')}>
        <p>{t('s5_intro')}</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          {(['s5_li1', 's5_li2', 's5_li3', 's5_li4', 's5_li5'] as const).map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
        <p>
          {t('s5_footer_pre')}{' '}
          <a href="mailto:d.tunyinko@alustudent.com" className="text-green-600 dark:text-green-400">
            d.tunyinko@alustudent.com
          </a>
          {t('s5_footer_post')}
        </p>
      </Section>

      <Section title={t('s6_title')}>
        <p>
          <strong>{t('cloudinary_label')}</strong> {t('s6_cloudinary')}
        </p>
        <p>
          <strong>{t('render_label')}</strong> {t('s6_render')}
        </p>
        <p>
          <strong>DigitalOcean</strong> hosts our managed PostgreSQL database. See{' '}
          <a
            href="https://www.digitalocean.com/legal/data-processing-agreement"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 dark:text-green-400 underline"
          >
            DigitalOcean's DPA
          </a>{' '}
          for their data-handling obligations.
        </p>
        <p>
          <strong>{t('maps_label')}</strong> {t('s6_maps')}
        </p>
      </Section>

      <Section title={t('s7_title')}>
        <p>{t('s7_body')}</p>
      </Section>

      <Section title={t('s8_title')}>
        <p>{t('s8_body')}</p>
      </Section>

      <Section title={t('s9_title')}>
        <p>{t('s9_body1')}</p>
        <p>{t('s9_body2')}</p>
      </Section>

      <Section title={t('s10_title')}>
        <p>{t('s10_body1')}</p>
        <p>{t('s10_body2')}</p>
      </Section>

      <Section title={t('s11_title')}>
        <p>{t('s11_body')}</p>
      </Section>

      <p className="text-xs text-gray-400 dark:text-slate-400 text-center pt-2">
        {t('contact_pre')}{' '}
        <a href="mailto:d.tunyinko@alustudent.com" className="underline">
          d.tunyinko@alustudent.com
        </a>
      </p>
    </div>
  );
}
