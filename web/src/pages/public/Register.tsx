import { Link } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import PageTransition from '@/components/common/PageTransition';
import styles from './AuthPage.module.css';

export default function Register() {
  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.left}>
          <div className={styles.hero}>
            <h1>Join Rihla</h1>
            <p>Create your account and start your learning journey today.</p>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.formCard}>
            <h2>Create Account</h2>
            <p className={styles.subtitle}>Set up your profile in a few steps</p>
            <RegisterForm />
            <div className={styles.links}>
              <span>Already have an account? <Link to="/login">Log in</Link></span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
