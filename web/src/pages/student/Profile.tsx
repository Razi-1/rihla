import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import TextArea from '@/components/common/TextArea';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import Avatar from '@/components/common/Avatar';
import Skeleton from '@/components/common/Skeleton';
import StarRating from '@/components/common/StarRating';
import { useAuthStore } from '@/store/authStore';
import { studentService } from '@/services/studentService';
import { subjectService } from '@/services/subjectService';
import { reviewService } from '@/services/reviewService';
import type { StudentProfile } from '@/types/student';
import type { StudentReview } from '@/types/review';
import type { EducationLevel } from '@/types/common';
import styles from './Profile.module.css';

export default function Profile() {
  const account = useAuthStore((s) => s.account);
  const navigate = useNavigate();
  const [, setProfile] = useState<StudentProfile | null>(null);
  const [levels, setLevels] = useState<EducationLevel[]>([]);
  const [myReviews, setMyReviews] = useState<StudentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { bio: '', education_level_id: '' },
  });

  useEffect(() => {
    Promise.all([
      studentService.getProfile(),
      subjectService.getEducationLevels(),
      reviewService.getMyReviews(),
    ]).then(([profileRes, levelsRes, reviewsRes]) => {
      const p = profileRes.data.data;
      setProfile(p);
      setLevels(levelsRes.data.data);
      setMyReviews(reviewsRes.data.data ?? []);
      reset({ bio: p.bio ?? '', education_level_id: p.education_level?.id ?? '' });
    }).finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: { bio: string; education_level_id: string }) => {
    setSaving(true);
    setSuccess(false);
    try {
      await studentService.updateProfile({
        bio: data.bio || undefined,
        education_level_id: data.education_level_id || undefined,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <PageTransition><div style={{ padding: '2rem' }}><Skeleton width="100%" height={200} /></div></PageTransition>;

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Avatar src={account?.profile_picture_url ?? null} firstName={account?.first_name ?? ''} lastName={account?.last_name ?? ''} size="xl" />
            <div>
              <h2>{account?.first_name} {account?.last_name}</h2>
              <p className={styles.email}>{account?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <Select
              label="Education Level"
              placeholder="Select level"
              options={levels.map((l) => ({ value: l.id, label: l.name }))}
              {...register('education_level_id')}
            />
            <TextArea label="Bio" placeholder="Tell tutors a bit about yourself..." rows={4} {...register('bio')} />

            {success && <p className={styles.success}>Profile updated successfully!</p>}
            <Button type="submit" loading={saving}>Save Changes</Button>
          </form>
        </div>

        <div className={styles.card} style={{ marginTop: 'var(--space-6)' }}>
          <div className={styles.reviewsHeader}>
            <Star size={20} strokeWidth={1.5} style={{ color: 'var(--color-primary-blue)' }} />
            <h2>Reviews I've Given</h2>
            <span className={styles.reviewCount}>{myReviews.length}</span>
          </div>

          {myReviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {myReviews.map((r) => (
                <div
                  key={r.id}
                  className={styles.reviewItem}
                  onClick={() => navigate(`/student/tutors/${r.tutor_id}#review-${r.id}`)}
                >
                  <Avatar
                    src={r.tutor_profile_picture}
                    firstName={r.tutor_name.split(' ')[0] ?? ''}
                    lastName={r.tutor_name.split(' ')[1] ?? ''}
                    size="md"
                  />
                  <div className={styles.reviewContent}>
                    <div className={styles.reviewMeta}>
                      <span className={styles.tutorName}>{r.tutor_name}</span>
                      <span className={styles.reviewDate}>{formatDate(r.created_at)}</span>
                    </div>
                    <StarRating value={r.rating} readonly size={14} />
                    <p className={styles.reviewPreview}>{r.comment}</p>
                  </div>
                  <ChevronRight size={18} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyReviews}>
              You haven't reviewed any tutors yet. Once you do, your reviews will appear here.
            </p>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
