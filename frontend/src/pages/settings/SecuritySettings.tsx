// i18n-ready: see src/locales/{en,rw}/
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { authApi } from '../../api/endpoints/auth';
import { useAuth } from '../../context/AuthContext';

const schema = z
  .object({
    current_password: z.string().optional(),
    new_password: z.string().min(8, 'Minimum 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
type FormData = z.infer<typeof schema>;

const INPUT_CLS =
  'w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 pr-10';

export default function SecuritySettings() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation('settings');
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [unlinking, setUnlinking] = useState(false);

  const hasPassword = !!user?.has_usable_password;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await authApi.changePassword(data.current_password ?? '', data.new_password);
      toast.success(hasPassword ? t('password_changed') : t('password_set'));
      reset();
      if (!hasPassword) await refreshUser();
    } catch {
      toast.error(hasPassword ? t('wrong_current_password') : t('set_password_failed'));
    }
  }

  const triggerGoogleLink = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await authApi.googleLink(tokenResponse.access_token);
        await refreshUser();
        toast.success(t('google_connected_toast'));
      } catch (err: unknown) {
        const s = (err as { response?: { status?: number } })?.response?.status;
        if (s === 409) {
          toast.error(t('google_already_linked'));
        } else {
          toast.error(t('google_connect_failed'));
        }
      }
    },
    onError: () => toast.error(t('google_connect_failed')),
  });

  async function handleGoogleUnlink() {
    setUnlinking(true);
    try {
      await authApi.googleUnlink();
      await refreshUser();
      toast.success(t('google_disconnected_toast'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? t('google_disconnect_failed'));
    } finally {
      setUnlinking(false);
    }
  }

  return (
    <div className="pb-24 px-4">
      <div className="py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">
          {t('page_security')}
        </h1>
      </div>

      <div className="mb-2">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">
          {hasPassword ? t('change_password_title') : t('set_password_title')}
        </h2>
        {!hasPassword && (
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
            {t('google_password_hint')}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {hasPassword && (
          <div>
            <label
              htmlFor="sec-current-password"
              className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1"
            >
              {t('current_password')}
            </label>
            <div className="relative">
              <input
                id="sec-current-password"
                type={show.current ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('current_password')}
                className={INPUT_CLS}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.current_password && (
              <p className="text-xs text-red-500 mt-1">{errors.current_password.message}</p>
            )}
          </div>
        )}

        {(
          [
            { name: 'new_password', labelKey: 'new_password_label', key: 'new' as const },
            { name: 'confirm_password', labelKey: 'confirm_new_password', key: 'confirm' as const },
          ] as const
        ).map(({ name, labelKey, key }) => (
          <div key={name}>
            <label
              htmlFor={name}
              className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1"
            >
              {t(labelKey)}
            </label>
            <div className="relative">
              <input
                id={name}
                type={show[key] ? 'text' : 'password'}
                autoComplete="new-password"
                {...register(name)}
                className={INPUT_CLS}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {show[key] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]?.message}</p>}
          </div>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
        >
          {isSubmitting
            ? t('saving')
            : hasPassword
              ? t('change_password_btn')
              : t('set_password_btn')}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">
          {t('connected_accounts')}
        </h2>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Google</p>
              {user?.google_connected ? (
                <p className="text-xs text-green-600 dark:text-green-400">
                  {t('connected_as', { email: user.email })}
                </p>
              ) : (
                <p className="text-xs text-gray-400">{t('not_connected')}</p>
              )}
            </div>
          </div>

          {user?.google_connected ? (
            <button
              type="button"
              onClick={handleGoogleUnlink}
              disabled={unlinking}
              className="text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
            >
              {unlinking ? t('disconnecting') : t('disconnect')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => triggerGoogleLink()}
              className="flex items-center gap-2 py-2 px-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z"
                />
              </svg>
              {t('connect')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
