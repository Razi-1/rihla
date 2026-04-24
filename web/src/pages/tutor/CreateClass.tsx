import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import PageTransition from '@/components/common/PageTransition';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import TextArea from '@/components/common/TextArea';
import Button from '@/components/common/Button';
import { sessionService } from '@/services/sessionService';
import type { SessionCreateRequest } from '@/types/session';
import styles from './CreateClass.module.css';

const defaultValues = {
  title: '',
  session_type: 'individual_class',
  mode: 'online',
  duration_minutes: '60',
  start_time: '',
  max_group_size: '',
  location_address: '',
};

export default function CreateClass() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues,
  });

  const onSubmit = async (data: typeof defaultValues) => {
    setError('');
    try {
      const payload: SessionCreateRequest = {
        title: data.title,
        session_type: data.session_type as SessionCreateRequest['session_type'],
        mode: data.mode as SessionCreateRequest['mode'],
        duration_minutes: parseInt(data.duration_minutes) as SessionCreateRequest['duration_minutes'],
        start_time: new Date(data.start_time).toISOString(),
        max_group_size: data.max_group_size ? parseInt(data.max_group_size) : undefined,
        location_address: data.location_address || undefined,
      };
      const res = await sessionService.create(payload);
      navigate(`/tutor/classes/${res.data.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Failed to create class');
    }
  };

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.card}>
          <h2>Create a New Class</h2>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <Input label="Class Title" placeholder="e.g. O-Level Mathematics" {...register('title', { required: true })} />

            <div className={styles.row}>
              <Select label="Type" options={[
                { value: 'booking_meeting', label: 'Booking Meeting' },
                { value: 'individual_class', label: 'Individual Class' },
                { value: 'group_class', label: 'Group Class' },
              ]} {...register('session_type')} />
              <Select label="Mode" options={[
                { value: 'online', label: 'Online' },
                { value: 'physical', label: 'In-Person' },
                { value: 'hybrid', label: 'Hybrid' },
              ]} {...register('mode')} />
            </div>

            <div className={styles.row}>
              <Select label="Duration" options={[
                { value: '30', label: '30 minutes' },
                { value: '45', label: '45 minutes' },
                { value: '60', label: '1 hour' },
                { value: '90', label: '1.5 hours' },
                { value: '120', label: '2 hours' },
              ]} {...register('duration_minutes')} />
              <Input label="Start Time" type="datetime-local" {...register('start_time', { required: true })} />
            </div>

            <Input label="Max Group Size (optional)" type="number" placeholder="Leave empty for unlimited" {...register('max_group_size')} />
            <TextArea label="Location Address (for in-person)" placeholder="Full address..." rows={2} {...register('location_address')} />

            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" loading={isSubmitting} size="lg">Create Class</Button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
