import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import PageTransition from '@/components/common/PageTransition';
import Input from '@/components/common/Input';
import TextArea from '@/components/common/TextArea';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import Avatar from '@/components/common/Avatar';
import Chip from '@/components/common/Chip';
import Skeleton from '@/components/common/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { tutorService } from '@/services/tutorService';
import { subjectService } from '@/services/subjectService';
import { locationService } from '@/services/locationService';
import type { TutorProfile } from '@/types/tutor';
import type { Country, Region, City, Subject, EducationLevel, SubjectLevel } from '@/types/common';
import styles from '../student/Profile.module.css';

interface SubjectEntry {
  subject_id: string;
  education_level_id: string;
  subject_name: string;
  education_level_name: string;
}

export default function EditProfile() {
  const account = useAuthStore((s) => s.account);
  const [, setProfile] = useState<TutorProfile | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allLevels, setAllLevels] = useState<EducationLevel[]>([]);
  const [tutorSubjects, setTutorSubjects] = useState<SubjectEntry[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { bio: '', mode_of_tuition: '', country_id: '', region_id: '', city_id: '', timezone: '', individual_rate: '', group_rate: '', currency: 'LKR' },
  });

  const countryId = watch('country_id');
  const regionId = watch('region_id');

  useEffect(() => {
    Promise.all([
      tutorService.getPreview(),
      locationService.getCountries(),
    ]).then(([profileRes, countriesRes]) => {
      const p = profileRes.data.data;
      setProfile(p);
      setCountries(countriesRes.data.data);

      const existing: SubjectEntry[] = (p.subjects ?? []).map((s: SubjectLevel) => ({
        subject_id: s.subject_id,
        education_level_id: s.education_level_id,
        subject_name: s.subject_name,
        education_level_name: s.education_level_name,
      }));
      setTutorSubjects(existing);

      reset({
        bio: p.bio ?? '',
        mode_of_tuition: p.mode_of_tuition ?? '',
        country_id: p.country?.id ?? '',
        region_id: p.region?.id ?? '',
        city_id: p.city?.id ?? '',
        timezone: p.timezone ?? '',
        individual_rate: p.individual_rate?.toString() ?? '',
        group_rate: p.group_rate?.toString() ?? '',
        currency: p.currency ?? 'LKR',
      });
    }).finally(() => setLoading(false));
  }, [reset]);

  useEffect(() => {
    subjectService.getSubjects()
      .then((res) => setAllSubjects(res.data.data))
      .catch(() => {});
    subjectService.getEducationLevels()
      .then((res) => setAllLevels(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (countryId) locationService.getRegions(countryId).then((r) => setRegions(r.data.data));
  }, [countryId]);

  useEffect(() => {
    if (regionId) locationService.getCities(regionId).then((r) => setCities(r.data.data));
  }, [regionId]);

  const subjectOptions = useMemo(
    () => allSubjects.map((s) => ({ value: s.id, label: s.name })),
    [allSubjects],
  );

  const levelOptions = useMemo(
    () => allLevels.map((l) => ({ value: l.id, label: l.name })),
    [allLevels],
  );

  const addSubject = () => {
    if (!selectedSubject || !selectedLevel) return;

    const alreadyExists = tutorSubjects.some(
      (ts) => ts.subject_id === selectedSubject && ts.education_level_id === selectedLevel,
    );
    if (alreadyExists) return;

    const subj = allSubjects.find((s) => s.id === selectedSubject);
    const lvl = allLevels.find((l) => l.id === selectedLevel);
    if (!subj || !lvl) return;

    setTutorSubjects((prev) => [
      ...prev,
      {
        subject_id: selectedSubject,
        education_level_id: selectedLevel,
        subject_name: subj.name,
        education_level_name: lvl.name,
      },
    ]);
    setSelectedSubject('');
    setSelectedLevel('');
  };

  const removeSubject = (subjectId: string, levelId: string) => {
    setTutorSubjects((prev) =>
      prev.filter((ts) => !(ts.subject_id === subjectId && ts.education_level_id === levelId)),
    );
  };

  const onSubmit = async (data: Record<string, string>) => {
    setSaving(true);
    setSuccess(false);
    try {
      await tutorService.updateProfile({
        bio: data.bio || undefined,
        mode_of_tuition: (data.mode_of_tuition as 'online' | 'physical' | 'hybrid') || undefined,
        country_id: data.country_id || undefined,
        region_id: data.region_id || undefined,
        city_id: data.city_id || undefined,
        timezone: data.timezone || undefined,
        subjects: tutorSubjects.map((ts) => ({
          subject_id: ts.subject_id,
          education_level_id: ts.education_level_id,
        })),
      });
      if (data.individual_rate || data.group_rate) {
        await tutorService.updatePricing({
          individual_rate: data.individual_rate ? parseFloat(data.individual_rate) : null,
          group_rate: data.group_rate ? parseFloat(data.group_rate) : null,
          currency: data.currency || undefined,
        });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (loading) return <PageTransition><Skeleton width="100%" height={400} borderRadius="var(--radius-md)" /></PageTransition>;

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Avatar src={account?.profile_picture_url ?? null} firstName={account?.first_name ?? ''} lastName={account?.last_name ?? ''} size="xl" />
            <div><h2>{account?.first_name} {account?.last_name}</h2><p className={styles.email}>{account?.email}</p></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <TextArea label="Bio" placeholder="Tell students about yourself..." rows={4} {...register('bio')} />
            <Select label="Mode of Tuition" placeholder="Select mode" options={[{ value: 'online', label: 'Online' }, { value: 'physical', label: 'In-Person' }, { value: 'hybrid', label: 'Hybrid' }]} {...register('mode_of_tuition')} />
            <Select label="Country" placeholder="Select country" options={countries.map((c) => ({ value: c.id, label: c.name }))} {...register('country_id')} />
            {regions.length > 0 && <Select label="Region" placeholder="Select region" options={regions.map((r) => ({ value: r.id, label: r.name }))} {...register('region_id')} />}
            {cities.length > 0 && <Select label="City" placeholder="Select city" options={cities.map((c) => ({ value: c.id, label: c.name }))} {...register('city_id')} />}
            <Input label="Timezone" placeholder="e.g. Asia/Colombo" {...register('timezone')} />

            <h3 style={{ fontSize: 'var(--text-title-md)', marginTop: 'var(--space-4)' }}>Subjects You Teach</h3>

            {tutorSubjects.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {tutorSubjects.map((ts) => (
                  <Chip
                    key={`${ts.subject_id}-${ts.education_level_id}`}
                    onRemove={() => removeSubject(ts.subject_id, ts.education_level_id)}
                  >
                    {ts.subject_name} — {ts.education_level_name}
                  </Chip>
                ))}
              </div>
            )}
            {tutorSubjects.length === 0 && (
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                No subjects added yet. Add at least one subject to complete your profile.
              </p>
            )}

            {(subjectOptions.length > 0 && levelOptions.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--space-3)', alignItems: 'end' }}>
                <Select
                  label="Subject"
                  placeholder="Select subject"
                  options={subjectOptions}
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                />
                <Select
                  label="Level"
                  placeholder="Select level"
                  options={levelOptions}
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                />
                <Button type="button" variant="secondary" size="md" onClick={addSubject} disabled={!selectedSubject || !selectedLevel}>
                  Add
                </Button>
              </div>
            )}

            <h3 style={{ fontSize: 'var(--text-title-md)', marginTop: 'var(--space-4)' }}>Pricing</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <Input label="Individual Rate" type="number" placeholder="0" {...register('individual_rate')} />
              <Input label="Group Rate" type="number" placeholder="0" {...register('group_rate')} />
              <Select label="Currency" options={[{ value: 'LKR', label: 'LKR' }, { value: 'USD', label: 'USD' }, { value: 'PKR', label: 'PKR' }, { value: 'GBP', label: 'GBP' }]} {...register('currency')} />
            </div>

            {success && <p className={styles.success}>Profile updated!</p>}
            <Button type="submit" loading={saving}>Save Changes</Button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
