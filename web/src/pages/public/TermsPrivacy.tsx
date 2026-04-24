import { useLocation } from 'react-router-dom';
import PageTransition from '@/components/common/PageTransition';
import styles from './TermsPrivacy.module.css';

export default function TermsPrivacy() {
  const { pathname } = useLocation();
  const isTerms = pathname === '/terms';

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.content}>
          <h1>{isTerms ? 'Terms of Service' : 'Privacy Policy'}</h1>
          <p className={styles.updated}>Last updated: April 2026</p>
          <div className={styles.body}>
            <p>
              {isTerms
                ? 'These Terms of Service govern your use of the Rihla platform. By accessing or using our services, you agree to be bound by these terms.'
                : 'This Privacy Policy describes how Rihla collects, uses, and protects your personal information when you use our tutoring platform.'}
            </p>
            <h2>1. {isTerms ? 'Acceptance of Terms' : 'Information We Collect'}</h2>
            <p>
              {isTerms
                ? 'By creating an account or using Rihla, you agree to comply with these terms. If you do not agree, please do not use the platform.'
                : 'We collect information you provide directly, including your name, email address, government ID (encrypted), and profile information.'}
            </p>
            <h2>2. {isTerms ? 'User Accounts' : 'How We Use Information'}</h2>
            <p>
              {isTerms
                ? 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration.'
                : 'We use your information to provide tutoring services, facilitate communication between users, and improve our platform.'}
            </p>
            <h2>3. {isTerms ? 'User Conduct' : 'Data Security'}</h2>
            <p>
              {isTerms
                ? 'Users must not engage in harassment, share inappropriate content, or misuse the platform. Violations may result in account restriction.'
                : 'We implement industry-standard security measures including encryption at rest and in transit, access controls, and regular security audits.'}
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
