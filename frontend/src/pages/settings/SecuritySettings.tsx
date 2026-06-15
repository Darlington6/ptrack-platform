import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../../api/endpoints/auth';

const schema = z
  .object({
    current_password: z.string().min(1, 'Required'),
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
  const [show, setShow] = useState({ current: false, new: false, confirm: false });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      await authApi.changePassword(data.current_password, data.new_password);
      toast.success('Password changed.');
      reset();
    } catch {
      toast.error('Incorrect current password.');
    }
  }

  return (
    <div className="pb-24 px-4">
      <div className="py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">Security</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {(
          [
            { name: 'current_password', label: 'Current password', key: 'current' as const },
            { name: 'new_password', label: 'New password', key: 'new' as const },
            { name: 'confirm_password', label: 'Confirm new password', key: 'confirm' as const },
          ] as const
        ).map(({ name, label, key }) => (
          <div key={name}>
            <label className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1">
              {label}
            </label>
            <div className="relative">
              <input
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
          {isSubmitting ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
