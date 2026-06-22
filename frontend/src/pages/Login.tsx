import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const INPUT_CLS =
  'w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400';

const LABEL_CLS = 'block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const user = await googleLogin(tokenResponse.access_token);
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (!user.has_completed_onboarding) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } catch (err: unknown) {
        const s = (err as { response?: { status?: number } })?.response?.status;
        if (s === 409) {
          toast.error(
            'This email is linked to a different Google account. Please log in with your original method.'
          );
        } else {
          toast.error('Google sign-in failed. Please try again.');
        }
      }
    },
    onError: () => toast.error('Google sign-in failed. Please try again.'),
  });

  async function onSubmit(data: FormData) {
    try {
      const user = await login(data.identifier, data.password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (!user.email_verified && !user.phone_verified) {
        navigate('/verify', {
          state: { channel: 'email', identifier: data.identifier },
        });
      } else if (!user.has_completed_onboarding) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const axiosErr = err as { response?: { status?: number } };
      const status = axiosErr.response?.status;
      if (status === 401) {
        toast.error('Incorrect email/phone or password.');
      } else if (status === 429) {
        toast.error('Too many attempts. Please wait a moment.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4">
      <p className="text-2xl font-bold text-green-600 text-center mb-1">pTrack</p>
      <p className="text-gray-500 dark:text-slate-400 text-sm text-center mb-6">
        {t('welcome_back')}
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 w-full max-w-md">
        <button
          type="button"
          onClick={() => triggerGoogleLogin()}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
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
          {t('continue_with_google')}
        </button>

        {/* OR divider */}
        <div className="flex items-center gap-3 my-4">
          <hr className="flex-1 border-gray-200 dark:border-slate-700" />
          <span className="text-xs text-gray-400">{t('or')}</span>
          <hr className="flex-1 border-gray-200 dark:border-slate-700" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email / Phone */}
          <div>
            <label className={LABEL_CLS}>{t('email_or_phone')}</label>
            <input
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={LABEL_CLS}>{t('password')}</label>
              <Link
                to="/forgot-password"
                className="text-xs text-green-600 hover:underline font-medium"
              >
                {t('forgot_password')}
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                className={`${INPUT_CLS} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {isSubmitting ? t('logging_in') : t('login')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
          {t('no_account')}{' '}
          <Link to="/register" className="text-green-600 font-medium hover:underline">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
