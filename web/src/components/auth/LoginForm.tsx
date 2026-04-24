import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/utils/validators';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import AccountTypeSelector from './AccountTypeSelector';
import type { AccountType } from '@/types/common';
import styles from './LoginForm.module.css';

export default function LoginForm() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { account_type: 'student' },
  });

  const accountType = watch('account_type');

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      await login(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Invalid email or password');
    }
  };

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

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        icon={<Lock size={16} strokeWidth={1.5} />}
        error={errors.password?.message}
        {...register('password')}
      />

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" fullWidth loading={isSubmitting} size="lg">
        Log In
      </Button>
    </form>
  );
}
