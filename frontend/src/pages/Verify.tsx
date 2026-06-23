import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { OtpInput } from '../components/ui/OtpInput';
import { authApi } from '../api/endpoints/auth';
import { useAuth } from '../context/AuthContext';

export default function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation('auth');

  const state = location.state as { channel?: string; identifier?: string } | null;
  const channel = (state?.channel ?? 'email') as 'email' | 'phone';
  const identifier = state?.identifier ?? user?.email ?? '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleSubmit() {
    if (code.length < 6) {
      toast.error('Please enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await authApi.confirmVerification(channel, code, 'register_verify');
      const updated = await refreshUser();
      if (!updated.has_completed_onboarding) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch {
      toast.error(t('code_expired'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await authApi.sendVerification(channel, 'register_verify');
      toast.success(t('verification_sent'));
      setCountdown(60);
      setCanResend(false);
      setCode('');
    } catch {
      toast.error('Failed to resend. Please try again.');
    }
  }

  const channelLabel = channel === 'email' ? 'email' : 'phone';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📩</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-1">
          Check your {channelLabel}
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-gray-700 dark:text-slate-200">{identifier}</span>
        </p>

        <div className="mb-6">
          <OtpInput value={code} onChange={setCode} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || code.length < 6}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 mb-4"
        >
          {loading ? 'Verifying…' : 'Verify'}
        </button>

        <div className="text-sm text-gray-500 dark:text-slate-400">
          {canResend ? (
            <button onClick={handleResend} className="text-green-600 font-medium hover:underline">
              {t('resend_code')}
            </button>
          ) : (
            <span>Resend in {countdown}s</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate(user?.has_completed_onboarding ? '/dashboard' : '/onboarding')}
          className="block mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 mx-auto"
        >
          {t('skip_for_now')}
        </button>
      </div>
    </div>
  );
}
