import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, Lock } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import styles from './AdminProfile.module.css';

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'Minimum 8 characters').max(128),
    confirm_password: z.string().min(1, 'Confirm your new password'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export default function AdminProfilePage() {
  usePageTitle('My Profile');
  const account = useAuthStore((s) => s.account);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: PasswordForm) => {
    setLoading(true);
    setMessage(null);
    try {
      await api.put('/auth/password', {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      setMessage({ type: 'success', text: 'Password changed successfully' });
      reset();
    } catch (err) {
      console.error('[AdminProfile] Password change failed:', err);
      setMessage({ type: 'error', text: 'Failed to change password. Check your current password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminHeader title="My Profile" subtitle="View your account information" />

      <div className={styles.content}>
        <div className={styles.layout}>
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.cardHeader}>
              <User size={18} strokeWidth={1.5} />
              <h3>Account Information</h3>
            </div>
            <div className={styles.fields}>
              <div className={styles.field}>
                <span className={styles.label}>Name</span>
                <span className={styles.value}>
                  {account?.first_name} {account?.last_name}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Role</span>
                <span className={styles.value}>Administrator</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Account ID</span>
                <span className={styles.valueMono}>{account?.account_id}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className={styles.cardHeader}>
              <Lock size={18} strokeWidth={1.5} />
              <h3>Change Password</h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <Input
                label="Current Password"
                type="password"
                error={errors.current_password?.message}
                {...register('current_password')}
              />
              <Input
                label="New Password"
                type="password"
                error={errors.new_password?.message}
                {...register('new_password')}
              />
              <Input
                label="Confirm New Password"
                type="password"
                error={errors.confirm_password?.message}
                {...register('confirm_password')}
              />

              {message && (
                <p
                  className={
                    message.type === 'success' ? styles.success : styles.error
                  }
                >
                  {message.text}
                </p>
              )}

              <Button type="submit" loading={loading}>
                Update Password
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}
