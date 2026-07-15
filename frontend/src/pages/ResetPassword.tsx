import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { OtpInput } from '../components/ui/OtpInput';
import { authApi } from '../api/endpoints/auth';
import { useAuth } from '../context/AuthContext';

type StrengthKey = 'weak' | 'fair' | 'good' | 'strong';

function getStrengthKey(pwd: string): { score: number; key: StrengthKey | ''; color: string } {
  if (pwd.length === 0) return { score: 0, key: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map: { score: number; key: StrengthKey | ''; color: string }[] = [
    { score: 0, key: '', color: '' },
    { score: 1, key: 'weak', color: 'bg-red-500' },
    { score: 2, key: 'fair', color: 'bg-amber-500' },
    { score: 3, key: 'good', color: 'bg-blue-500' },
    { score: 4, key: 'strong', color: 'bg-green-500' },
  ];
  return map[Math.min(score, 4)]!;
}

const schema = z
  .object({
    new_password: z.string().min(8),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

const INPUT_CLS =
  'w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation('auth');

  const identifier = (location.state as { identifier?: string } | null)?.identifier ?? '';

  const [code, setCode] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPwdValue, setNewPwdValue] = useState('');
  const strength = getStrengthKey(newPwdValue);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    if (code.length < 6) {
      toast.error(t('reset_code_required'));
      return;
    }
    try {
      await authApi.resetPasswordConfirm(identifier, code, data.new_password);
      logout();
      toast.success(t('reset_success'));
      navigate('/login');
    } catch {
      toast.error(t('reset_code_invalid'));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-1">
          {t('reset_title')}
        </h1>
        {identifier && (
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            {t('sending_reset_to', { identifier })}
          </p>
        )}

        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3 text-center">
            {t('enter_code_label')}
          </p>
          <OtpInput value={code} onChange={setCode} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* New password */}
          <div>
            <label
              htmlFor="new_password"
              className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1"
            >
              {t('new_password')}
            </label>
            <div className="relative">
              <input
                id="new_password"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('new_password', {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewPwdValue(e.target.value),
                })}
                className={`${INPUT_CLS} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-xs text-red-500 mt-1">{t('password_min')}</p>
            )}
            {newPwdValue.length > 0 && (
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
                {strength.key && (
                  <p className="text-xs mt-1 font-medium text-gray-600 dark:text-slate-400">
                    {t(`strength_${strength.key}`)}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirm_password"
              className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1"
            >
              {t('confirm_new_password')}
            </label>
            <div className="relative">
              <input
                id="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('confirm_password')}
                className={`${INPUT_CLS} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-xs text-red-500 mt-1">{t('passwords_no_match_inline')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {isSubmitting ? t('resetting') : t('reset_password_btn')}
          </button>
        </form>
      </div>
    </div>
  );
}
