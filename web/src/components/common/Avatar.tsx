import { getInitials } from '@/utils/formatters';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string | null;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Avatar({ src, firstName, lastName, size = 'md', className }: AvatarProps) {
  return (
    <div className={`${styles.avatar} ${styles[size]} ${className ?? ''}`}>
      {src ? (
        <img src={src} alt={`${firstName} ${lastName}`} />
      ) : (
        <span>{getInitials(firstName, lastName)}</span>
      )}
    </div>
  );
}
