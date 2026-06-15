import React, { useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

function extractApiError(data: unknown): string {
  if (!data) return 'Registration failed. Please try again.';
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.map(extractApiError).filter(Boolean).join(' ');
  if (typeof data === 'object') {
    return Object.values(data as Record<string, unknown>)
      .map(extractApiError)
      .filter(Boolean)
      .join(' ');
  }
  return 'Registration failed. Please try again.';
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    sector: 'Kimironko',
    agreed: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }) as typeof form);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (!form.agreed) {
      setError('Please agree to the Terms & Privacy Policy.');
      return;
    }
    setLoading(true);
    try {
      const username = form.email.split('@')[0] ?? form.email;
      await register({ ...form, username, confirm_password: form.confirm_password });
      navigate('/dashboard');
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } };
      const data = axiosErr.response?.data;
      setError(extractApiError(data));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <span className="text-2xl font-bold text-green-600">pTrack</span>
            <h1 className="text-xl font-bold text-gray-900 mt-1">Create your account</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Full name</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="e.g. Yvette Habimana"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400">Use your legal name as it appears on your ID.</p>
            </div>

            {/* Email / phone — type="text" allows both formats without browser rejection */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email or phone number</label>
              <input
                type="text"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="youremail@example.com or +250 798 888 888"
                autoComplete="username"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400">
                We'll send a confirmation link/code to this address/phone number.
              </p>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400">Min. 6 characters.</p>
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Location / Sector */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Location / Sector</label>
              <select
                name="sector"
                value={form.sector}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="Kimironko">Kimironko</option>
              </select>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                name="agreed"
                checked={form.agreed}
                onChange={handleChange}
                className="mt-0.5 accent-green-600"
              />
              <span>
                I agree to the <span className="text-green-600 font-medium">Terms</span> &amp;{' '}
                <span className="text-green-600 font-medium">Privacy</span> Policy
              </span>
            </label>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
