import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Star, Trash2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getReviews, deleteReview } from '@/services/reviewService';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import type { ReviewRecord } from '@/types/admin';
import styles from './ReviewList.module.css';

export default function ReviewListPage() {
  usePageTitle('Review Management');
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<ReviewRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetcher = useCallback(() => getReviews({ limit: 100 }), []);
  const { data: reviews, loading, refetch } = useApi(fetcher);

  const handleDelete = async (reason: string) => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteReview(deleteTarget.id, reason);
      setDeleteTarget(null);
      refetch();
    } catch {
      // Error handled by UI
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<ReviewRecord>[] = [
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      width: '100px',
      render: (row) => (
        <span className={styles.rating}>
          <Star size={14} fill="var(--color-warning)" stroke="var(--color-warning)" />
          {row.rating}/5
        </span>
      ),
    },
    {
      key: 'text',
      header: 'Review',
      render: (row) => (
        <span className={styles.reviewText}>
          {row.text.length > 120 ? `${row.text.slice(0, 120)}...` : row.text}
        </span>
      ),
    },
    {
      key: 'is_deleted',
      header: 'Status',
      sortable: true,
      width: '100px',
      render: (row) =>
        row.is_deleted ? (
          <Badge variant="error">Deleted</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        ),
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      width: '140px',
      render: (row) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (row) =>
        !row.is_deleted ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          >
            <Trash2 size={14} />
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <AdminHeader
        title="Review Management"
        subtitle={`${reviews?.length ?? 0} reviews`}
      />
      <div className={styles.content}>
        <DataTable
          columns={columns}
          data={reviews ?? []}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => navigate(`/reviews/${row.id}`)}
          loading={loading}
          emptyMessage="No reviews found"
        />
      </div>

      <ConfirmAction
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Review"
        description="This review will be soft-deleted and hidden from public view. The original content is preserved for audit purposes."
        confirmLabel="Delete Review"
        variant="danger"
        loading={actionLoading}
      />
    </>
  );
}
