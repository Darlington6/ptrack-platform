import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
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

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) return;
    try {
      const user = await googleLogin(credentialResponse.credential);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (!user.has_completed_onboarding) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.error('This email is linked to a different Google account. Please log in with your original method.');
      } else {
        toast.error('Google sign-in failed. Please try again.');
      }
    }
  }

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
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google sign-in failed. Please try again.')}
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
            width={400}
          />
        </div>

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
