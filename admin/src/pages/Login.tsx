import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { loginAdmin } from '@/services/adminAuthService';
import { useAuthStore } from '@/store/authStore';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import styles from './Login.module.css';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  usePageTitle('Login');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    try {
      const res = await loginAdmin(data);
      setAuth(
        {
          account_id: res.account_id,
          account_type: 'admin',
          first_name: res.first_name,
          last_name: res.last_name,
          is_email_verified: res.is_email_verified,
          is_age_restricted: res.is_age_restricted,
        },
        res.access_token,
      );
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[AdminLogin] Login failed:', err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.brand}>
          <div className={styles.logo}>R</div>
          <h1 className={styles.title}>Rihla Admin</h1>
        </div>

        <div className={styles.warning}>
          <ShieldAlert size={16} strokeWidth={1.5} />
          <span>Authorized personnel only</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input
            label="Email"
            type="email"
            placeholder="admin@rihla.app"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" variant="primary" loading={loading}>
            Sign In
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
