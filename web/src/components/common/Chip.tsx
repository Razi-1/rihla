import { X } from 'lucide-react';
import styles from './Chip.module.css';

interface ChipProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export default function Chip({ children, onRemove, className }: ChipProps) {
  return (
    <span className={`${styles.chip} ${className ?? ''}`}>
      {children}
      {onRemove && (
        <button className={styles.remove} onClick={onRemove} aria-label="Remove">
          <X size={12} strokeWidth={1.5} />
        </button>
      )}
    </span>
  );
}
