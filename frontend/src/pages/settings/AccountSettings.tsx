import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/endpoints/auth';
import client from '../../api/client';
import type { User } from '../../types';

const schema = z.object({
  full_name: z.string().min(2, 'Required'),
  bio: z.string().max(200).optional(),
  weekly_goal: z.number().int().min(1).max(20),
});
type FormData = z.infer<typeof schema>;

const INPUT_CLS =
  'w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500';

export default function AccountSettings() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('settings');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user?.full_name ?? '',
      bio: user?.bio ?? '',
      weekly_goal: user?.weekly_goal ?? 3,
    },
  });

  async function onSubmit(data: FormData) {
    try {
      const res = await client.patch<User>('/auth/me/', data);
      setUser(res.data);
      toast.success(t('saved'));
    } catch {
      toast.error(t('save_failed'));
    }
  }

  async function handleResendEmail() {
    try {
      await authApi.sendVerification('email', 'register_verify');
      toast.success(t('resend_email_sent'));
    } catch {
      toast.error(t('resend_email_failed'));
    }
  }

  const isPhoneUser = user?.email?.startsWith('phone_');
  const showEmail = !isPhoneUser;
  const showPhone = !!user?.phone_number;

  return (
    <div className="pb-24 px-4">
      <div className="py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">{t('page_account')}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1"
          >
            {t('full_name')}
          </label>
          <input id="full_name" {...register('full_name')} className={INPUT_CLS} />
          {errors.full_name && (
            <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1"
          >
            {t('bio')}
          </label>
          <textarea
            id="bio"
            {...register('bio')}
            rows={3}
            className={`${INPUT_CLS} resize-none`}
            placeholder={t('bio_placeholder')}
          />
        </div>

        {showEmail && (
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1"
            >
              {t('email_label')}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="email"
                type="text"
                disabled
                value={user?.email ?? ''}
                className={`${INPUT_CLS} opacity-60 cursor-not-allowed flex-1`}
              />
              {user?.email_verified ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 whitespace-nowrap">
                  <CheckCircle size={13} /> {t('verified')}
                </span>
              ) : (
                <span className="text-xs font-medium text-amber-600 whitespace-nowrap">
                  {t('unverified')}
                </span>
              )}
            </div>
            {!user?.email_verified && (
              <button
                type="button"
                onClick={() => void handleResendEmail()}
                className="text-xs text-green-600 hover:underline mt-1"
              >
                {t('resend_email')}
              </button>
            )}
          </div>
        )}

        {showPhone && (
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1"
            >
              {t('phone_label')}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="phone"
                type="text"
                disabled
                value={user?.phone_number ?? ''}
                className={`${INPUT_CLS} opacity-60 cursor-not-allowed flex-1`}
              />
              {user?.phone_verified ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 whitespace-nowrap">
                  <CheckCircle size={13} /> {t('verified')}
                </span>
              ) : (
                <span className="text-xs font-medium text-amber-600 whitespace-nowrap">
                  {t('unverified')}
                </span>
              )}
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="weekly_goal"
            className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1"
          >
            {t('weekly_goal')}
          </label>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{t('weekly_goal_desc')}</p>
          <select
            id="weekly_goal"
            {...register('weekly_goal', { valueAsNumber: true })}
            className={`${INPUT_CLS} bg-white dark:bg-slate-700`}
          >
            {[1, 2, 3, 5, 7, 10, 14, 20].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? t('weekly_report_singular', { n }) : t('weekly_report_plural', { n })}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
        >
          {isSubmitting ? t('saving') : t('save_changes')}
        </button>
      </form>
    </div>
  );
}
