import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/endpoints/auth';

const schema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
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
    // Always show success (don't leak user existence)
    toast.success('If an account exists, a reset code has been sent.');
    // Fire the request but don't await its result for UX
    authApi.resetPasswordRequest(data.identifier).catch(() => undefined);
    // Navigate after 1.5s
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
          <ArrowLeft size={16} /> Back to login
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
              Email or phone number
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="youremail@example.com or +250 7XX XXX XXX"
              {...register('identifier')}
              className={INPUT_CLS}
            />
            {errors.identifier && (
              <p className="text-xs text-red-500 mt-1">{errors.identifier.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Sending…' : t('send_reset_code')}
          </button>
        </form>
      </div>
    </div>
  );
}
