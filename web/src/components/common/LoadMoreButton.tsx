import Button from './Button';
import styles from './LoadMoreButton.module.css';

interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
  hasMore: boolean;
}

export default function LoadMoreButton({ onClick, loading, hasMore }: LoadMoreButtonProps) {
  if (!hasMore) return null;
  return (
    <div className={styles.wrapper}>
      <Button variant="secondary" onClick={onClick} loading={loading}>
        Load More
      </Button>
    </div>
  );
}
