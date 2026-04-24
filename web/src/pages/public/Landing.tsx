import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Shield, Video, MessageCircle, Star, ArrowRight } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import PageTransition from '@/components/common/PageTransition';
import styles from './Landing.module.css';

const features = [
  { icon: Search, title: 'AI-Powered Search', desc: 'Describe what you need in plain language and let AI find the perfect tutor for you.' },
  { icon: Shield, title: 'Verified Tutors', desc: 'Every tutor is verified with government ID. Parents can monitor and control access.' },
  { icon: Video, title: 'Live Video Classes', desc: 'Join online classes with built-in video calling, attendance tracking, and chat.' },
  { icon: MessageCircle, title: 'Encrypted Chat', desc: 'Communicate securely with end-to-end encrypted messaging between students and tutors.' },
  { icon: Star, title: 'Smart Reviews', desc: 'AI-analyzed reviews help you understand tutor quality at a glance with sentiment summaries.' },
];

export default function Landing() {
  return (
    <PageTransition>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Find the perfect tutor for your learning journey
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Rihla connects students with verified tutors using AI-powered matching.
            Schedule classes, join video sessions, and track progress — all in one platform.
          </motion.p>
          <motion.div
            className={styles.heroActions}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link to="/register" className={styles.primaryBtn}>
              Get Started <ArrowRight size={18} strokeWidth={1.5} />
            </Link>
            <Link to="/tutors" className={styles.secondaryBtn}>
              Browse Tutors
            </Link>
          </motion.div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <h2>Everything you need to learn effectively</h2>
          <motion.div
            className={styles.featureGrid}
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
          >
            {features.map((f) => (
              <motion.div key={f.title} className={styles.featureCard} variants={staggerItem}>
                <div className={styles.featureIcon}>
                  <f.icon size={24} strokeWidth={1.5} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2>Ready to start learning?</h2>
          <p>Join thousands of students and tutors on Rihla.</p>
          <Link to="/register" className={styles.primaryBtn}>
            Create Free Account <ArrowRight size={18} strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
