import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Download, Filter } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getAuditLog, exportAuditLogCsv } from '@/services/auditService';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import type { AuditEntry } from '@/types/admin';
import styles from './AuditLog.module.css';

const actionTypes = [
  '',
  'restrict_account',
  'unrestrict_account',
  'delete_account',
  'delete_review',
  'create_admin',
  'create_category',
  'create_subject',
  'update_subject',
  'delete_subject',
];

export default function AuditLogPage() {
  usePageTitle('Audit Log');
  const [actionFilter, setActionFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetcher = useCallback(
    () => getAuditLog({ action_type: actionFilter || undefined, limit: 100 }),
    [actionFilter],
  );
  const { data: entries, loading } = useApi(fetcher, [actionFilter]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportAuditLogCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Export failed silently
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<AuditEntry>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      sortable: true,
      width: '160px',
      render: (row) => format(new Date(row.created_at), 'MMM d, yyyy HH:mm'),
    },
    {
      key: 'admin_name',
      header: 'Admin',
      sortable: true,
      width: '140px',
      render: (row) => row.admin_name ?? row.admin_id.slice(0, 8),
    },
    {
      key: 'action_type',
      header: 'Action',
      sortable: true,
      width: '160px',
      render: (row) => (
        <Badge variant="info">{row.action_type.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key: 'target_entity_type',
      header: 'Target',
      width: '100px',
      render: (row) =>
        row.target_entity_type ? (
          <span className={styles.target}>{row.target_entity_type}</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (row) => (
        <span className={styles.reason}>
          {row.reason.length > 80 ? `${row.reason.slice(0, 80)}...` : row.reason}
        </span>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      sortable: true,
      width: '100px',
      render: (row) => (
        <Badge variant={row.outcome === 'success' ? 'success' : 'error'}>
          {row.outcome}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <AdminHeader
        title="Audit Log"
        subtitle="Immutable record of all admin actions"
        actions={
          <Button variant="secondary" onClick={handleExport} loading={exporting}>
            <Download size={16} /> Export CSV
          </Button>
        }
      />
      <div className={styles.content}>
        <div className={styles.filters}>
          <Filter size={16} strokeWidth={1.5} className={styles.filterIcon} />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">All Actions</option>
            {actionTypes
              .filter(Boolean)
              .map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
          </select>
          {actionFilter && (
            <Button variant="ghost" size="sm" onClick={() => setActionFilter('')}>
              Clear
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={entries ?? []}
          keyExtractor={(row) => row.id}
          pageSize={50}
          loading={loading}
          emptyMessage="No audit entries found"
        />
      </div>
    </>
  );
}
