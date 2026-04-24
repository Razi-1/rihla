import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getReviews, deleteReview } from '@/services/reviewService';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import styles from './ReviewDetail.module.css';

export default function ReviewDetailPage() {
  usePageTitle('Review Detail');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetcher = useCallback(async () => {
    const reviews = await getReviews({ limit: 100 });
    return reviews.find((r) => r.id === id) ?? null;
  }, [id]);

  const { data: review, loading, refetch } = useApi(fetcher, [id]);

  const handleDelete = async (reason: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await deleteReview(id, reason);
      setShowDelete(false);
      refetch();
    } catch {
      // Error handled by UI
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <AdminHeader title="Loading..." />
        <div className={styles.content}>
          <div className={styles.skeleton} />
        </div>
      </>
    );
  }

  if (!review) {
    return (
      <>
        <AdminHeader title="Review not found" />
        <div className={styles.content}>
          <Button variant="ghost" onClick={() => navigate('/reviews')}>
            <ArrowLeft size={16} /> Back to reviews
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title="Review Detail"
        actions={
          <Button variant="ghost" onClick={() => navigate('/reviews')}>
            <ArrowLeft size={16} /> Back
          </Button>
        }
      />

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.meta}>
            <div className={styles.rating}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  fill={i < review.rating ? 'var(--color-warning)' : 'none'}
                  stroke="var(--color-warning)"
                  strokeWidth={1.5}
                />
              ))}
              <span className={styles.ratingNum}>{review.rating}/5</span>
            </div>
            <div className={styles.badges}>
              {review.is_deleted ? (
                <Badge variant="error">Deleted</Badge>
              ) : (
                <Badge variant="success">Active</Badge>
              )}
            </div>
          </div>

          <p className={styles.text}>{review.text}</p>

          <div className={styles.footer}>
            <span className={styles.date}>
              {format(new Date(review.created_at), 'MMMM d, yyyy')}
            </span>
            <span className={styles.tutorId}>Tutor: {review.tutor_id.slice(0, 8)}...</span>
          </div>
        </div>

        {!review.is_deleted && (
          <div className={styles.actions}>
            <Button variant="danger" onClick={() => setShowDelete(true)}>
              <Trash2 size={16} /> Delete Review
            </Button>
          </div>
        )}
      </div>

      <ConfirmAction
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Review"
        description="This review will be soft-deleted and hidden from public view."
        confirmLabel="Delete Review"
        variant="danger"
        loading={actionLoading}
      />
    </>
  );
}
