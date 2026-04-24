import { Link } from 'react-router-dom';
import PasswordRecoveryForm from '@/components/auth/PasswordRecoveryForm';
import PageTransition from '@/components/common/PageTransition';
import styles from './AuthPage.module.css';

export default function PasswordRecovery() {
  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.left}>
          <div className={styles.hero}>
            <h1>Reset Password</h1>
            <p>We'll send you a secure link to reset your password.</p>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.formCard}>
            <h2>Forgot Password</h2>
            <p className={styles.subtitle}>Enter your email to receive a reset link</p>
            <PasswordRecoveryForm />
            <div className={styles.links}>
              <Link to="/login">Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
