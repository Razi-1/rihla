import { motion } from 'framer-motion';
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  trendLabel?: string;
  accent?: 'blue' | 'red' | 'green' | 'orange';
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  accent = 'blue',
}: StatCardProps) {
  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.top}>
        <div className={`${styles.iconWrapper} ${styles[accent]}`}>
          <Icon size={20} strokeWidth={1.5} />
        </div>
        {trend && (
          <span className={`${styles.trend} ${styles[`trend${trend}`]}`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trendLabel}
          </span>
        )}
      </div>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </motion.div>
  );
}
