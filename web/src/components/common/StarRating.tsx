import { Star } from 'lucide-react';
import styles from './StarRating.module.css';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, size = 18, readonly = false }: StarRatingProps) {
  return (
    <div className={styles.wrapper} role={readonly ? 'img' : 'radiogroup'} aria-label={`Rating: ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${styles.star} ${star <= value ? styles.filled : ''}`}
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            strokeWidth={1.5}
            fill={star <= value ? '#F79009' : 'none'}
            color={star <= value ? '#F79009' : 'var(--color-surface-high)'}
          />
        </button>
      ))}
    </div>
  );
}
