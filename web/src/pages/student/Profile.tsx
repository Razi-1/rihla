import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import PageTransition from '@/components/common/PageTransition';
import TextArea from '@/components/common/TextArea';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import Avatar from '@/components/common/Avatar';
import Skeleton from '@/components/common/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { studentService } from '@/services/studentService';
import { subjectService } from '@/services/subjectService';
import type { StudentProfile } from '@/types/student';
import type { EducationLevel } from '@/types/common';
import styles from './Profile.module.css';

export default function Profile() {
  const account = useAuthStore((s) => s.account);
  const [, setProfile] = useState<StudentProfile | null>(null);
  const [levels, setLevels] = useState<EducationLevel[]>([]);
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
    ]).then(([profileRes, levelsRes]) => {
      const p = profileRes.data.data;
      setProfile(p);
      setLevels(levelsRes.data.data);
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
      </div>
    </PageTransition>
  );
}
