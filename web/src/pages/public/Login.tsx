import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoginForm from '@/components/auth/LoginForm';
import PageTransition from '@/components/common/PageTransition';
import styles from './AuthPage.module.css';

export default function Login() {
  const [searchParams] = useSearchParams();
  const registered = searchParams.get('registered');

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.left}>
          <div className={styles.hero}>
            <h1>Welcome to Rihla</h1>
            <p>Connect with expert tutors and unlock your learning potential.</p>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.formCard}>
            <h2>Log In</h2>
            <p className={styles.subtitle}>Enter your credentials to continue</p>
            {registered && (
              <motion.div
                className={styles.successBanner}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Account created successfully! You can now log in.
              </motion.div>
            )}
            <LoginForm />
            <div className={styles.links}>
              <Link to="/forgot-password">Forgot password?</Link>
              <span>Don't have an account? <Link to="/register">Sign up</Link></span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
