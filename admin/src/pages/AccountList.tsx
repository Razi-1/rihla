import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Filter } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getAccounts } from '@/services/accountService';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import type { AccountRecord } from '@/types/admin';
import styles from './AccountList.module.css';

const accountTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'student', label: 'Students' },
  { value: 'tutor', label: 'Tutors' },
  { value: 'parent', label: 'Parents' },
];

const restrictedOptions = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Restricted' },
  { value: 'false', label: 'Active' },
];

export default function AccountListPage() {
  usePageTitle('Account Management');
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('');
  const [restrictedFilter, setRestrictedFilter] = useState('');

  const fetcher = useCallback(
    () =>
      getAccounts({
        account_type: typeFilter || undefined,
        is_restricted: restrictedFilter ? restrictedFilter === 'true' : undefined,
        limit: 100,
      }),
    [typeFilter, restrictedFilter],
  );

  const { data: accounts, loading } = useApi(fetcher, [typeFilter, restrictedFilter]);

  const columns: Column<AccountRecord>[] = [
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
      key: 'account_type',
      header: 'Type',
      sortable: true,
      render: (row) => (
        <Badge variant="info">{row.account_type}</Badge>
      ),
    },
    {
      key: 'is_restricted',
      header: 'Status',
      sortable: true,
      render: (row) =>
        row.is_restricted ? (
          <Badge variant="error">Restricted</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        ),
    },
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
          : '—',
    },
  ];

  return (
    <>
      <AdminHeader
        title="Account Management"
        subtitle={`${accounts?.length ?? 0} accounts`}
      />
      <div className={styles.content}>
        <div className={styles.filters}>
          <Filter size={16} strokeWidth={1.5} className={styles.filterIcon} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={styles.select}
          >
            {accountTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={restrictedFilter}
            onChange={(e) => setRestrictedFilter(e.target.value)}
            className={styles.select}
          >
            {restrictedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {(typeFilter || restrictedFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter('');
                setRestrictedFilter('');
              }}
            >
              Clear
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={accounts ?? []}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => navigate(`/accounts/${row.id}`)}
          loading={loading}
          emptyMessage="No accounts found"
        />
      </div>
    </>
  );
}
