import { useState, useEffect } from 'react';
import { MapPin, Clock } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import Chip from '@/components/common/Chip';
import StarRating from '@/components/common/StarRating';
import Skeleton from '@/components/common/Skeleton';
import { tutorService } from '@/services/tutorService';
import { formatCurrency, DAY_NAMES } from '@/utils/formatters';
import { SESSION_MODES } from '@/utils/constants';
import type { TutorProfile } from '@/types/tutor';
import styles from '../public/TutorProfilePublic.module.css';

export default function ProfilePreview() {
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tutorService.getPreview().then((res) => setTutor(res.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageTransition><Skeleton width="100%" height={400} borderRadius="var(--radius-md)" /></PageTransition>;
  if (!tutor) return <div className={styles.page}><p>Profile not found</p></div>;

  return (
    <PageTransition>
      <div className={styles.page}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-body-sm)' }}>This is how your profile appears to students.</p>
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <Avatar src={tutor.account.profile_picture_url} firstName={tutor.account.first_name} lastName={tutor.account.last_name} size="xl" />
                <div className={styles.profileInfo}>
                  <h1>{tutor.account.first_name} {tutor.account.last_name}</h1>
                  <div className={styles.meta}>
                    {tutor.city && <span><MapPin size={14} strokeWidth={1.5} /> {tutor.city.name}</span>}
                    {tutor.mode_of_tuition && <Badge variant="info">{SESSION_MODES[tutor.mode_of_tuition]}</Badge>}
                  </div>
                  {tutor.average_rating !== null && (
                    <div className={styles.ratingRow}>
                      <StarRating value={Math.round(tutor.average_rating)} readonly size={20} />
                      <span className={styles.ratingText}>{tutor.average_rating.toFixed(1)} ({tutor.review_count})</span>
                    </div>
                  )}
                </div>
              </div>
              {tutor.bio && <div className={styles.section}><h2>About</h2><p>{tutor.bio}</p></div>}
              {tutor.subjects.length > 0 && <div className={styles.section}><h2>Subjects</h2><div className={styles.chips}>{tutor.subjects.map((s) => <Chip key={s.id}>{s.subject_name} — {s.education_level_name}</Chip>)}</div></div>}
            </div>
          </div>
          <aside className={styles.aside}>
            <div className={styles.pricingCard}>
              <h3>Pricing</h3>
              {tutor.individual_rate != null && <div className={styles.priceRow}><span>Individual: {formatCurrency(tutor.individual_rate, tutor.currency ?? 'USD')}/hr</span></div>}
              {tutor.group_rate != null && <div className={styles.priceRow}><span>Group: {formatCurrency(tutor.group_rate, tutor.currency ?? 'USD')}/hr</span></div>}
            </div>
            {tutor.working_hours.length > 0 && (
              <div className={styles.hoursCard}>
                <h3>Working Hours</h3>
                {tutor.working_hours.filter((wh) => wh.is_working).map((wh) => (
                  <div key={wh.day_of_week} className={styles.hourRow}>
                    <Clock size={14} strokeWidth={1.5} /><span>{DAY_NAMES[wh.day_of_week]}</span><span className={styles.hourTime}>{wh.start_time} — {wh.end_time}</span>
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
