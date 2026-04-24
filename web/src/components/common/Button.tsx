import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { buttonTap } from '@/hooks/useAnimations';
import styles from './Button.module.css';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, icon, children, className, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={`${styles.button} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${className ?? ''}`}
        disabled={disabled || loading}
        whileTap={disabled || loading ? undefined : buttonTap}
        whileHover={disabled || loading ? undefined : { scale: 1.02 }}
        {...props}
      >
        {loading ? (
          <Loader2 size={size === 'sm' ? 14 : 18} className={styles.spinner} strokeWidth={1.5} />
        ) : icon ? (
          <span className={styles.icon}>{icon}</span>
        ) : null}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
