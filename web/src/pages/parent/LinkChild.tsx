import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, CheckCircle } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { parentService } from '@/services/parentService';
import styles from '../tutor/CreateClass.module.css';

export default function LinkChild() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { student_email: '' },
  });

  const onSubmit = async (data: { student_email: string }) => {
    setError('');
    try {
      await parentService.linkChild({ student_email: data.student_email });
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Failed to send link request');
    }
  };

  if (sent) {
    return (
      <PageTransition>
        <div className={styles.page}>
          <div className={styles.card} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <CheckCircle size={48} strokeWidth={1.5} color="var(--color-success)" />
            <h2 style={{ marginTop: 'var(--space-4)' }}>Link Request Sent</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>Your child will need to confirm the link from their account.</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.card}>
          <h2>Link Your Child</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>Enter your child's student account email to link their account to yours.</p>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <Input label="Child's Email" type="email" placeholder="child@example.com" icon={<Mail size={16} strokeWidth={1.5} />} error={error} {...register('student_email', { required: 'Email is required' })} />
            <Button type="submit" loading={isSubmitting} size="lg">Send Link Request</Button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
