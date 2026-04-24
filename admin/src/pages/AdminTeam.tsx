import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApi } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getAdminTeam, createAdmin } from '@/services/adminTeamService';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import type { AdminTeamMember } from '@/types/admin';
import styles from './AdminTeam.module.css';

const createAdminSchema = z.object({
  email: z.string().email('Invalid email'),
  first_name: z.string().min(1, 'Required').max(100),
  last_name: z.string().min(1, 'Required').max(100),
  temporary_password: z.string().min(8, 'Minimum 8 characters').max(128),
});

type CreateAdminForm = z.infer<typeof createAdminSchema>;

export default function AdminTeamPage() {
  usePageTitle('Admin Team');
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetcher = useCallback(() => getAdminTeam(), []);
  const { data: admins, loading, refetch } = useApi(fetcher);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAdminForm>({ resolver: zodResolver(createAdminSchema) });

  const onSubmit = async (data: CreateAdminForm) => {
    setActionLoading(true);
    try {
      await createAdmin(data);
      reset();
      setShowForm(false);
      setSuccessMsg(`Admin account created for ${data.email}`);
      setTimeout(() => setSuccessMsg(''), 5000);
      refetch();
    } catch {
      // Error handled
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<AdminTeamMember>[] = [
    {
      key: 'first_name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <span className={styles.name}>
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'is_email_verified',
      header: 'Verified',
      render: (row) =>
        row.is_email_verified ? (
          <Badge variant="success">Yes</Badge>
        ) : (
          <Badge variant="warning">No</Badge>
        ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (row) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'last_login_at',
      header: 'Last Login',
      sortable: true,
      render: (row) =>
        row.last_login_at
          ? format(new Date(row.last_login_at), 'MMM d, HH:mm')
          : 'Never',
    },
  ];

  return (
    <>
      <AdminHeader
        title="Admin Team"
        subtitle={`${admins?.length ?? 0} administrators`}
        actions={
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Create Admin
          </Button>
        }
      />

      <div className={styles.content}>
        {successMsg && (
          <motion.div
            className={styles.successBanner}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {successMsg}
          </motion.div>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div
              className={styles.formCard}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className={styles.formHeader}>
                <h3>Create Admin Account</h3>
                <button className={styles.closeBtn} onClick={() => setShowForm(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className={styles.formFields}>
                <div className={styles.formRow}>
                  <Input label="First Name" error={errors.first_name?.message} {...register('first_name')} />
                  <Input label="Last Name" error={errors.last_name?.message} {...register('last_name')} />
                </div>
                <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
                <Input
                  label="Temporary Password"
                  type="password"
                  error={errors.temporary_password?.message}
                  {...register('temporary_password')}
                />
                <p className={styles.hint}>
                  The new admin will be required to change this password on first login.
                </p>
                <Button type="submit" loading={actionLoading}>Create Admin</Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <DataTable
          columns={columns}
          data={admins ?? []}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyMessage="No administrators found"
        />
      </div>
    </>
  );
}
