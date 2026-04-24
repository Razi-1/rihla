import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Users } from 'lucide-react';
import type { AccountType } from '@/types/common';
import styles from './AccountTypeSelector.module.css';

interface Props {
  value: AccountType | '';
  onChange: (type: AccountType) => void;
}

const types = [
  { type: 'student' as AccountType, label: 'Student', desc: 'Find tutors & learn', icon: GraduationCap },
  { type: 'tutor' as AccountType, label: 'Tutor', desc: 'Teach & manage classes', icon: BookOpen },
  { type: 'parent' as AccountType, label: 'Parent', desc: 'Monitor your child', icon: Users },
];

export default function AccountTypeSelector({ value, onChange }: Props) {
  return (
    <div className={styles.grid}>
      {types.map(({ type, label, desc, icon: Icon }) => (
        <motion.button
          key={type}
          type="button"
          className={`${styles.card} ${value === type ? styles.selected : ''}`}
          onClick={() => onChange(type)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={styles.iconWrapper}>
            <Icon size={24} strokeWidth={1.5} />
          </div>
          <span className={styles.label}>{label}</span>
          <span className={styles.desc}>{desc}</span>
        </motion.button>
      ))}
    </div>
  );
}
