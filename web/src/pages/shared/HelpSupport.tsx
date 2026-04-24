import { HelpCircle, Mail, MessageCircle, BookOpen } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import styles from './HelpSupport.module.css';

const faqs = [
  { q: 'How do I find a tutor?', a: 'Use the search page to browse tutors by subject, education level, and mode. You can also use AI-powered search by describing what you need in plain language.' },
  { q: 'How does class booking work?', a: 'Tutors create classes and invite students. Students can accept or decline invites. For group classes, students can also request to join.' },
  { q: 'Is my data secure?', a: 'Yes. Government IDs are encrypted with AES-256, chat messages are end-to-end encrypted, and all connections use HTTPS.' },
  { q: 'How do I verify my email?', a: 'Check your inbox for a verification email sent after registration. Click the link to verify. You can resend it from the banner shown on every page.' },
  { q: 'Can I delete my account?', a: 'Yes. Go to Settings and click Delete Account. You will have a 7-day grace period to cancel before permanent deletion.' },
];

export default function HelpSupport() {
  return (
    <PageTransition>
      <div className={styles.page}>
        <h1>Help & Support</h1>
        <p className={styles.subtitle}>Find answers to common questions or get in touch.</p>

        <div className={styles.contactGrid}>
          <div className={styles.contactCard}>
            <Mail size={24} strokeWidth={1.5} />
            <h3>Email Support</h3>
            <p>support@rihla.app</p>
          </div>
          <div className={styles.contactCard}>
            <MessageCircle size={24} strokeWidth={1.5} />
            <h3>Live Chat</h3>
            <p>Available 9 AM - 6 PM</p>
          </div>
          <div className={styles.contactCard}>
            <BookOpen size={24} strokeWidth={1.5} />
            <h3>Documentation</h3>
            <p>Browse our guides</p>
          </div>
        </div>

        <div className={styles.faqSection}>
          <h2>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            {faqs.map((faq) => (
              <details key={faq.q} className={styles.faqItem}>
                <summary className={styles.faqQ}>
                  <HelpCircle size={16} strokeWidth={1.5} />
                  {faq.q}
                </summary>
                <p className={styles.faqA}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
