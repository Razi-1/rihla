import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import Chip from '@/components/common/Chip';
import { formatCurrency, formatRating } from '@/utils/formatters';
import { SESSION_MODES } from '@/utils/constants';
import { cardHover } from '@/hooks/useAnimations';
import type { TutorCard as TutorCardType } from '@/types/tutor';
import styles from './TutorCard.module.css';

interface Props {
  tutor: TutorCardType;
  linkPrefix?: string;
}

export default function TutorCard({ tutor, linkPrefix = '/tutors' }: Props) {
  return (
    <motion.div variants={cardHover} initial="rest" whileHover="hover">
      <Link to={`${linkPrefix}/${tutor.id}`} className={styles.card}>
        <div className={styles.top}>
          <Avatar
            src={tutor.profile_picture_url}
            firstName={tutor.first_name}
            lastName={tutor.last_name}
            size="lg"
          />
          <div className={styles.info}>
            <h3>{tutor.first_name} {tutor.last_name}</h3>
            {tutor.city_name && (
              <span className={styles.location}>
                <MapPin size={14} strokeWidth={1.5} />
                {tutor.city_name}{tutor.country_name ? `, ${tutor.country_name}` : ''}
              </span>
            )}
            {tutor.average_rating !== null && (
              <span className={styles.rating}>
                <Star size={14} strokeWidth={1.5} fill="#F79009" color="#F79009" />
                {formatRating(tutor.average_rating)}
                <span className={styles.reviewCount}>({tutor.review_count})</span>
              </span>
            )}
          </div>
          {tutor.mode_of_tuition && (
            <Badge variant="info">
              {SESSION_MODES[tutor.mode_of_tuition]}
            </Badge>
          )}
        </div>

        {tutor.bio && (
          <p className={styles.bio}>{tutor.bio.slice(0, 120)}{tutor.bio.length > 120 ? '...' : ''}</p>
        )}

        <div className={styles.subjects}>
          {tutor.subjects.slice(0, 4).map((s) => (
            <Chip key={s.id}>{s.subject_name}</Chip>
          ))}
          {tutor.subjects.length > 4 && (
            <Chip>+{tutor.subjects.length - 4} more</Chip>
          )}
        </div>

        <div className={styles.pricing}>
          {tutor.individual_rate != null && (
            <span>{formatCurrency(tutor.individual_rate, tutor.currency ?? 'USD')}/hr</span>
          )}
          {tutor.sentiment_summary && (
            <span className={styles.sentiment}>{tutor.sentiment_summary}</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
