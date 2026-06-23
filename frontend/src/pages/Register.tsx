import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

// ── Password strength ─────────────────────────────────────────────────────────

function getStrength(pwd: string): { score: number; label: string; color: string } {
  if (pwd.length === 0) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Weak', color: 'bg-red-500' },
    { score: 2, label: 'Fair', color: 'bg-amber-500' },
    { score: 3, label: 'Good', color: 'bg-blue-500' },
    { score: 4, label: 'Strong', color: 'bg-green-500' },
  ];
  return map[Math.min(score, 4)]!;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    full_name: z.string().min(2, 'Full name required'),
    email: z.string().optional(),
    phone_number: z.string().optional(),
    password: z.string().min(8, 'Minimum 8 characters'),
    confirm_password: z.string(),
    sector: z.string(),
    agreed: z.boolean().refine((v) => v, 'Please agree to the terms'),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

// ── Styles ────────────────────────────────────────────────────────────────────

const INPUT_CLS =
  'w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400';

const LABEL_CLS = 'block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1';

// ── Component ─────────────────────────────────────────────────────────────────

export default function Register() {
  const { register: authRegister, googleLogin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const [contactTab, setContactTab] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { sector: 'Kimironko', agreed: false },
  });

  const strength = getStrength(passwordValue);

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const user = await googleLogin(tokenResponse.access_token);
        if (!user.has_completed_onboarding) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } catch (err: unknown) {
        const s = (err as { response?: { status?: number } })?.response?.status;
        if (s === 409) {
          toast.error('An account with this email already exists. Try signing in instead.');
        } else {
          toast.error('Google sign-up failed. Please try again.');
        }
      }
    },
    onError: () => toast.error('Google sign-up failed. Please try again.'),
  });

  async function onSubmit(data: FormData) {
    const contact = contactTab === 'email' ? data.email : data.phone_number;
    if (!contact) {
      toast.error(contactTab === 'email' ? 'Email is required.' : 'Phone number is required.');
      return;
    }

    try {
      const emailField = contactTab === 'email' ? (data.email ?? '') : '';
      const phoneField = contactTab === 'phone' ? (data.phone_number ?? '') : '';
      const identifier = contactTab === 'email' ? emailField : phoneField;
      const username = emailField ? (emailField.split('@')[0] ?? emailField) : `user_${Date.now()}`;

      await authRegister({
        full_name: data.full_name,
        email: identifier,
        phone_number: phoneField,
        password: data.password,
        sector: data.sector,
        username,
        confirm_password: data.confirm_password,
      });

      navigate('/verify', { state: { channel: contactTab, identifier } });
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } };
      const apiData = axiosErr.response?.data;
      if (apiData && typeof apiData === 'object') {
        const msgs = Object.values(apiData as Record<string, string[]>)
          .flat()
          .join(' ');
        toast.error(msgs || t('registration_failed'));
      } else {
        toast.error(t('registration_failed'));
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-8">
      <p className="text-2xl font-bold text-green-600 text-center mb-1">pTrack</p>
      <p className="text-gray-500 dark:text-slate-400 text-sm text-center mb-6">
        {t('create_account')}
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
          {t('sign_up_with_google')}
        </button>

        {/* OR divider */}
        <div className="flex items-center gap-3 my-4">
          <hr className="flex-1 border-gray-200 dark:border-slate-700" />
          <span className="text-xs text-gray-400">{t('or')}</span>
          <hr className="flex-1 border-gray-200 dark:border-slate-700" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Full name */}
          <div>
            <label className={LABEL_CLS}>{t('full_name')}</label>
            <input
              type="text"
              autoComplete="name"
              placeholder="e.g. Yvette Habimana"
              {...register('full_name')}
              className={INPUT_CLS}
            />
            {errors.full_name && (
              <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{t('legal_name_hint')}</p>
          </div>

          {/* Contact tab toggle */}
          <div>
            <div className="flex mb-2">
              <button
                type="button"
                onClick={() => setContactTab('email')}
                className={
                  contactTab === 'email'
                    ? 'flex-1 py-2 text-sm font-semibold rounded-l-xl bg-green-600 text-white flex items-center justify-center gap-1.5'
                    : 'flex-1 py-2 text-sm font-semibold rounded-l-xl border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 flex items-center justify-center gap-1.5'
                }
              >
                <Mail size={14} /> Email
              </button>
              <button
                type="button"
                onClick={() => setContactTab('phone')}
                className={
                  contactTab === 'phone'
                    ? 'flex-1 py-2 text-sm font-semibold rounded-r-xl bg-green-600 text-white flex items-center justify-center gap-1.5'
                    : 'flex-1 py-2 text-sm font-semibold rounded-r-xl border border-l-0 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 flex items-center justify-center gap-1.5'
                }
              >
                <Phone size={14} /> Phone
              </button>
            </div>

            {contactTab === 'email' ? (
              <input
                type="email"
                autoComplete="email"
                placeholder="youremail@example.com"
                {...register('email')}
                className={INPUT_CLS}
              />
            ) : (
              <input
                type="tel"
                autoComplete="tel"
                placeholder="+250 7XX XXX XXX"
                {...register('phone_number')}
                className={INPUT_CLS}
              />
            )}
            <p className="text-xs text-gray-400 mt-1">
              {contactTab === 'email'
                ? "We'll send a confirmation code to this email address."
                : "We'll send a confirmation code to this phone number."}
            </p>
          </div>

          {/* Password */}
          <div>
            <label className={LABEL_CLS}>{t('password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('password', {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setPasswordValue(e.target.value),
                })}
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
            {/* Strength bar */}
            {passwordValue.length > 0 && (
              <>
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= strength.score ? strength.color : 'bg-gray-200 dark:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
                {strength.label && (
                  <p className="text-xs mt-1 font-medium text-gray-600 dark:text-slate-400">
                    {strength.label}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className={LABEL_CLS}>{t('confirm_password')}</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('confirm_password')}
                className={`${INPUT_CLS} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-xs text-red-500 mt-1">{errors.confirm_password.message}</p>
            )}
            {!errors.confirm_password && watch('confirm_password') && passwordValue && (
              <p
                className={`text-xs mt-1 ${
                  watch('confirm_password') === passwordValue ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {watch('confirm_password') === passwordValue
                  ? '✓ Passwords match'
                  : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          {/* Sector */}
          <div>
            <label className={LABEL_CLS}>{t('location_sector')}</label>
            <select {...register('sector')} className={`${INPUT_CLS} bg-white dark:bg-slate-700`}>
              <option value="Kimironko">Kimironko</option>
              <option value="Gasabo">Gasabo</option>
              <option value="Kicukiro">Kicukiro</option>
              <option value="Nyarugenge">Nyarugenge</option>
            </select>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              {...register('agreed')}
              onChange={(e) => setValue('agreed', e.target.checked)}
              className="mt-0.5 accent-green-600"
            />
            <span>
              {t('agree_terms')} — <span className="text-green-600 font-medium">Terms</span> &amp;{' '}
              <span className="text-green-600 font-medium">Privacy</span>
            </span>
          </label>
          {errors.agreed && <p className="text-xs text-red-500 -mt-2">{errors.agreed.message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {isSubmitting ? t('creating_account') : t('register')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
          {t('have_account')}{' '}
          <Link to="/login" className="text-green-600 font-medium hover:underline">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
