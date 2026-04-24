import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, CheckCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/utils/validators';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import AccountTypeSelector from './AccountTypeSelector';
import type { AccountType } from '@/types/common';
import styles from './PasswordRecoveryForm.module.css';

export default function PasswordRecoveryForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { account_type: 'student' },
  });

  const accountType = watch('account_type');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError('');
      await authService.forgotPassword(data);
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Failed to send reset link');
    }
  };

  if (sent) {
    return (
      <div className={styles.success}>
        <CheckCircle size={48} strokeWidth={1.5} color="var(--color-success)" />
        <h3>Check your email</h3>
        <p>If an account exists with that email, we've sent a password reset link.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <AccountTypeSelector
        value={accountType}
        onChange={(type: AccountType) => setValue('account_type', type)}
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        icon={<Mail size={16} strokeWidth={1.5} />}
        error={errors.email?.message}
        {...register('email')}
      />
      {error && <p className={styles.error}>{error}</p>}
      <Button type="submit" fullWidth loading={isSubmitting} size="lg">
        Send Reset Link
      </Button>
    </form>
  );
}
