import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, ArrowLeft } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import Chip from '@/components/common/Chip';
import StarRating from '@/components/common/StarRating';
import Button from '@/components/common/Button';
import Skeleton from '@/components/common/Skeleton';
import { tutorService } from '@/services/tutorService';
import { reviewService } from '@/services/reviewService';
import { formatCurrency, formatRelative, DAY_NAMES } from '@/utils/formatters';
import { SESSION_MODES } from '@/utils/constants';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import type { TutorProfile } from '@/types/tutor';
import type { Review } from '@/types/review';
import styles from './TutorProfilePublic.module.css';

export default function TutorProfilePublic() {
  const { id } = useParams<{ id: string }>();
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      tutorService.getPublic(id),
      reviewService.listForTutor(id),
    ]).then(([tutorRes, reviewRes]) => {
      setTutor(tutorRes.data.data);
      setReviews(reviewRes.data.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PageTransition>
        <div className={styles.page}>
          <Skeleton width="100%" height={200} borderRadius="var(--radius-md)" />
          <Skeleton width="60%" height={28} />
          <Skeleton width="40%" height={16} />
        </div>
      </PageTransition>
    );
  }

  if (!tutor) return <div className={styles.page}><p>Tutor not found</p></div>;

  return (
    <PageTransition>
      <div className={styles.page}>
        <Link to="/tutors" className={styles.back}>
          <ArrowLeft size={16} strokeWidth={1.5} /> Back to search
        </Link>

        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <Avatar
                  src={tutor.account.profile_picture_url}
                  firstName={tutor.account.first_name}
                  lastName={tutor.account.last_name}
                  size="xl"
                />
                <div className={styles.profileInfo}>
                  <h1>{tutor.account.first_name} {tutor.account.last_name}</h1>
                  <div className={styles.meta}>
                    {tutor.city && (
                      <span><MapPin size={14} strokeWidth={1.5} /> {tutor.city.name}{tutor.country ? `, ${tutor.country.name}` : ''}</span>
                    )}
                    {tutor.mode_of_tuition && (
                      <Badge variant="info">{SESSION_MODES[tutor.mode_of_tuition]}</Badge>
                    )}
                  </div>
                  {tutor.average_rating !== null && (
                    <div className={styles.ratingRow}>
                      <StarRating value={Math.round(tutor.average_rating)} readonly size={20} />
                      <span className={styles.ratingText}>{tutor.average_rating.toFixed(1)} ({tutor.review_count} reviews)</span>
                    </div>
                  )}
                </div>
              </div>

              {tutor.bio && (
                <div className={styles.section}>
                  <h2>About</h2>
                  <p>{tutor.bio}</p>
                </div>
              )}

              {tutor.subjects.length > 0 && (
                <div className={styles.section}>
                  <h2>Subjects</h2>
                  <div className={styles.chips}>
                    {tutor.subjects.map((s) => (
                      <Chip key={s.id}>{s.subject_name} — {s.education_level_name}</Chip>
                    ))}
                  </div>
                </div>
              )}

              {tutor.sentiment_summary && (
                <div className={styles.section}>
                  <h2>What Students Say</h2>
                  <p className={styles.sentiment}>{tutor.sentiment_summary}</p>
                </div>
              )}
            </div>

            {reviews.length > 0 && (
              <div className={styles.reviewsSection}>
                <h2>Reviews ({tutor.review_count})</h2>
                <motion.div
                  className={styles.reviewList}
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {reviews.map((r) => (
                    <motion.div key={r.id} className={styles.reviewCard} variants={staggerItem}>
                      <div className={styles.reviewHeader}>
                        <Avatar
                          src={r.student_profile_picture}
                          firstName={r.student_name.split(' ')[0] ?? ''}
                          lastName={r.student_name.split(' ')[1] ?? ''}
                          size="sm"
                        />
                        <div>
                          <span className={styles.reviewerName}>{r.student_name}</span>
                          <span className={styles.reviewDate}>{formatRelative(r.created_at)}</span>
                        </div>
                        <StarRating value={r.rating} readonly size={14} />
                      </div>
                      <p className={styles.reviewText}>{r.comment}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </div>

          <aside className={styles.aside}>
            <div className={styles.pricingCard}>
              <h3>Pricing</h3>
              {tutor.individual_rate != null && (
                <div className={styles.priceRow}>
                  <DollarSign size={16} strokeWidth={1.5} />
                  <span>Individual: {formatCurrency(tutor.individual_rate, tutor.currency ?? 'USD')}/hr</span>
                </div>
              )}
              {tutor.group_rate != null && (
                <div className={styles.priceRow}>
                  <DollarSign size={16} strokeWidth={1.5} />
                  <span>Group: {formatCurrency(tutor.group_rate, tutor.currency ?? 'USD')}/hr</span>
                </div>
              )}
              <Link to="/register">
                <Button fullWidth size="lg">Sign Up to Contact</Button>
              </Link>
            </div>

            {tutor.working_hours.length > 0 && (
              <div className={styles.hoursCard}>
                <h3>Working Hours</h3>
                {tutor.working_hours
                  .filter((wh) => wh.is_working)
                  .map((wh) => (
                    <div key={wh.day_of_week} className={styles.hourRow}>
                      <Clock size={14} strokeWidth={1.5} />
                      <span>{DAY_NAMES[wh.day_of_week]}</span>
                      <span className={styles.hourTime}>{wh.start_time} — {wh.end_time}</span>
                    </div>
                  ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}
