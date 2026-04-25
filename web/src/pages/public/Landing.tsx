import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Shield, Video, MessageCircle, Star, CalendarDays, ArrowRight } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import PageTransition from '@/components/common/PageTransition';
import styles from './Landing.module.css';

const features = [
  { icon: Search, title: 'AI-Powered Search', desc: 'Describe what you need in plain language and let AI find the perfect tutor for you.' },
  { icon: Shield, title: 'Verified Tutors', desc: 'Every tutor is verified with government ID. Parents can monitor and control access.' },
  { icon: Video, title: 'Live Video Classes', desc: 'Join online classes with built-in video calling, attendance tracking, and chat.' },
  { icon: MessageCircle, title: 'Encrypted Chat', desc: 'Communicate securely with end-to-end encrypted messaging between students and tutors.' },
  { icon: CalendarDays, title: 'Smart Scheduling', desc: 'Manage recurring classes, view your calendar, and never miss a session with reminders.' },
  { icon: Star, title: 'Smart Reviews', desc: 'AI-analyzed reviews help you understand tutor quality at a glance with sentiment summaries.' },
];

const sectionReveal = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Landing() {
  return (
    <PageTransition>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <motion.span
            className={styles.heroBadge}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            AI-Powered Tutoring Platform
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Find the perfect tutor for your learning journey
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Rihla connects students with verified tutors using AI-powered matching.
            Schedule classes, join video sessions, and track progress — all in one platform.
          </motion.p>
          <motion.div
            className={styles.heroActions}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <Link to="/register" className={styles.primaryBtn}>
              Get Started <ArrowRight size={18} strokeWidth={1.5} />
            </Link>
            <Link to="/tutors" className={styles.secondaryBtn}>
              Browse Tutors
            </Link>
          </motion.div>
        </div>
        <motion.div
          className={styles.heroGlow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
        />
      </section>

      <motion.section
        className={styles.features}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-80px' }}
        variants={sectionReveal}
      >
        <div className={styles.featuresInner}>
          <h2>Everything you need to learn effectively</h2>
          <motion.div
            className={styles.featureGrid}
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-60px' }}
          >
            {features.map((f) => (
              <motion.div key={f.title} className={styles.featureCard} variants={staggerItem} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                <div className={styles.featureIcon}>
                  <f.icon size={24} strokeWidth={1.5} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className={styles.cta}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-80px' }}
        variants={sectionReveal}
      >
        <div className={styles.ctaInner}>
          <h2>Ready to start learning?</h2>
          <p>Join thousands of students and tutors on Rihla.</p>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link to="/register" className={styles.primaryBtn}>
              Create Free Account <ArrowRight size={18} strokeWidth={1.5} />
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </PageTransition>
  );
}
