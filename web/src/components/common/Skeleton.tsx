import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export default function Skeleton({ width, height = 16, borderRadius, className }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} skeleton-shimmer ${className ?? ''}`}
      style={{ width, height, borderRadius: borderRadius ?? 'var(--radius-sm)' }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton width="100%" height={160} borderRadius="var(--radius-md) var(--radius-md) 0 0" />
      <div className={styles.cardBody}>
        <Skeleton width="60%" height={20} />
        <Skeleton width="80%" height={14} />
        <Skeleton width="40%" height={14} />
      </div>
    </div>
  );
}
