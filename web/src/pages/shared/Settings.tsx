import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageTransition from '@/components/common/PageTransition';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { changePasswordSchema, type ChangePasswordFormData } from '@/utils/validators';
import type { AccountSettings } from '@/types/auth';
import styles from './Settings.module.css';

export default function Settings() {
  const { logout } = useAuth();
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    authService.getSettings().then((res) => setSettings(res.data.data)).catch(() => {});
  }, []);

  const handlePasswordChange = async (data: ChangePasswordFormData) => {
    setError('');
    setSuccess('');
    try {
      await authService.changePassword({ current_password: data.current_password, new_password: data.new_password });
      setSuccess('Password changed successfully.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Failed to change password');
    }
  };

  const handleToggle = async (key: keyof AccountSettings, value: boolean) => {
    if (!settings) return;
    setSaving(true);
    try {
      await authService.updateSettings({ [key]: value });
      setSettings({ ...settings, [key]: value });
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authService.deleteAccount();
      logout();
    } catch { /* ignore */ }
    setDeleting(false);
  };

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.section}>
          <h2>Notifications</h2>
          {settings && (
            <div className={styles.toggles}>
              <label className={styles.toggle}>
                <span>Email Notifications</span>
                <input type="checkbox" checked={settings.notification_email} onChange={(e) => handleToggle('notification_email', e.target.checked)} disabled={saving} />
              </label>
              <label className={styles.toggle}>
                <span>Push Notifications</span>
                <input type="checkbox" checked={settings.notification_push} onChange={(e) => handleToggle('notification_push', e.target.checked)} disabled={saving} />
              </label>
              <label className={styles.toggle}>
                <span>Chat Notifications</span>
                <input type="checkbox" checked={settings.notification_chat} onChange={(e) => handleToggle('notification_chat', e.target.checked)} disabled={saving} />
              </label>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2>Change Password</h2>
          <form onSubmit={handleSubmit(handlePasswordChange)} className={styles.form}>
            <Input label="Current Password" type="password" error={errors.current_password?.message} {...register('current_password')} />
            <Input label="New Password" type="password" error={errors.new_password?.message} {...register('new_password')} />
            <Input label="Confirm New Password" type="password" error={errors.confirm_password?.message} {...register('confirm_password')} />
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>{success}</p>}
            <Button type="submit" loading={isSubmitting}>Change Password</Button>
          </form>
        </div>

        <div className={styles.section}>
          <h2>Danger Zone</h2>
          <p className={styles.dangerText}>Deleting your account will give you a 7-day grace period before permanent deletion.</p>
          <Button variant="danger" onClick={() => setShowDelete(true)}>Delete Account</Button>
        </div>

        <ConfirmDialog
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          message="Your account will be scheduled for deletion in 7 days. You can cancel during this period."
          confirmLabel="Delete Account"
          variant="danger"
          loading={deleting}
        />
      </div>
    </PageTransition>
  );
}
