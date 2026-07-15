import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/endpoints/auth';

const schema = z.object({
  identifier: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

const INPUT_CLS =
  'w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    toast.success(t('reset_code_sent'));
    authApi.resetPasswordRequest(data.identifier).catch(() => undefined);
    setTimeout(() => {
      navigate('/reset-password', { state: { identifier: data.identifier } });
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 w-full max-w-md">
        <Link
          to="/login"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 mb-6"
        >
          <ArrowLeft size={16} /> {t('back_to_login')}
        </Link>

        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-1">
          {t('forgot_title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{t('forgot_subtitle')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1"
            >
              {t('identifier_label')}
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder={t('identifier_placeholder')}
              {...register('identifier')}
              className={INPUT_CLS}
            />
            {errors.identifier && (
              <p className="text-xs text-red-500 mt-1">{t('identifier_required')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {isSubmitting ? t('sending') : t('send_reset_code')}
          </button>
        </form>
      </div>
    </div>
  );
}