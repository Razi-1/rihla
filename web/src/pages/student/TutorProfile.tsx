import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Clock, DollarSign, MessageCircle, Users, Star, Send, Check, Sparkles, Pencil, Trash2, X } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import Chip from '@/components/common/Chip';
import StarRating from '@/components/common/StarRating';
import Button from '@/components/common/Button';
import Skeleton from '@/components/common/Skeleton';
import TextArea from '@/components/common/TextArea';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuthStore } from '@/store/authStore';
import { tutorService } from '@/services/tutorService';
import { chatService } from '@/services/chatService';
import { reviewService } from '@/services/reviewService';
import { sessionService } from '@/services/sessionService';
import { enrolmentService } from '@/services/enrolmentService';
import { formatCurrency, formatDateTime, formatDuration, DAY_NAMES } from '@/utils/formatters';
import { SESSION_MODES } from '@/utils/constants';
import type { TutorProfile as TutorProfileType } from '@/types/tutor';
import type { Review } from '@/types/review';
import type { Session } from '@/types/session';
import styles from '../public/TutorProfilePublic.module.css';

export default function TutorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const account = useAuthStore((s) => s.account);
  const scrolledRef = useRef(false);
  const [tutor, setTutor] = useState<TutorProfileType | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [classes, setClasses] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewWeeks, setReviewWeeks] = useState(1);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    enrolmentService.list()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        if (Array.isArray(data)) {
          setJoinedIds(new Set(data.map((e) => e.session_id)));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [tutorRes, reviewRes] = await Promise.all([
          tutorService.getAuthenticated(id),
          reviewService.listForTutor(id),
        ]);
        setTutor(tutorRes.data.data);
        setReviews(Array.isArray(reviewRes.data.data) ? reviewRes.data.data : (reviewRes.data as unknown as { data: Review[] }).data ?? []);
      } catch (err) {
        console.error('[TutorProfile] Failed to load tutor profile:', err);
        setError('Failed to load tutor profile');
      }

      try {
        const classRes = await tutorService.getPublicClasses(id);
        const classData = classRes.data.data ?? classRes.data;
        setClasses(Array.isArray(classData) ? classData : []);
      } catch { /* classes optional */ }

      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleChat = async () => {
    if (!id) return;
    setChatLoading(true);
    try {
      const res = await chatService.createDM(id);
      navigate(`/chat/${res.data.data.room_id}`);
    } catch { /* ignore */ }
    setChatLoading(false);
  };

  const handleReviewSubmit = async () => {
    if (!id || reviewRating === 0 || reviewText.trim().length < 10) {
      setReviewError('Please provide a rating and at least 10 characters of text.');
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await reviewService.create({
        tutor_id: id,
        rating: reviewRating,
        text: reviewText,
        approximate_duration_weeks: reviewWeeks,
      });
      const reviewRes = await reviewService.listForTutor(id);
      setReviews(Array.isArray(reviewRes.data.data) ? reviewRes.data.data : []);
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewText('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setReviewError(msg ?? 'Failed to submit review.');
    }
    setReviewSubmitting(false);
  };

  useEffect(() => {
    if (scrolledRef.current || loading || !location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) {
      scrolledRef.current = true;
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 0 3px var(--color-primary-blue)';
        setTimeout(() => { el.style.boxShadow = ''; }, 2000);
      }, 100);
    }
  }, [loading, location.hash]);

  const refreshReviews = async () => {
    if (!id) return;
    const reviewRes = await reviewService.listForTutor(id);
    setReviews(Array.isArray(reviewRes.data.data) ? reviewRes.data.data : []);
  };

  const handleEditStart = (r: Review) => {
    setEditingReviewId(r.id);
    setSelectedReviewId(null);
    setEditRating(r.rating);
    setEditText(r.comment);
    setEditError(null);
  };

  const handleEditCancel = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditText('');
    setEditError(null);
  };

  const handleEditSubmit = async () => {
    if (!editingReviewId) return;
    if (editRating === 0 || editText.trim().length < 10) {
      setEditError('Please provide a rating and at least 10 characters of text.');
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      await reviewService.update(editingReviewId, { rating: editRating, text: editText });
      await refreshReviews();
      setEditingReviewId(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setEditError(msg ?? 'Failed to update review.');
    }
    setEditSubmitting(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      await reviewService.delete(deleteConfirmId);
      await refreshReviews();
      setDeleteConfirmId(null);
      setSelectedReviewId(null);
    } catch { /* ignore */ }
    setDeleteLoading(false);
  };

  const handleJoinClass = async (sessionId: string) => {
    setJoiningId(sessionId);
    try {
      await sessionService.requestJoin(sessionId);
      setJoinedIds((prev) => new Set(prev).add(sessionId));
      setClasses((prev) => prev.map((c) =>
        c.id === sessionId ? { ...c, enrolled_count: (c.enrolled_count ?? 0) + 1 } : c,
      ));
      if (id) {
        try { await chatService.createDM(id); } catch { /* DM may already exist */ }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (msg === 'Already enrolled in this class') {
        setJoinedIds((prev) => new Set(prev).add(sessionId));
      } else {
        alert(msg ?? 'Failed to join class');
      }
    }
    setJoiningId(null);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className={styles.page}>
          <Skeleton width="100%" height={300} borderRadius="var(--radius-md)" />
        </div>
      </PageTransition>
    );
  }

  if (error || !tutor) {
    return (
      <PageTransition>
        <div className={styles.page}>
          <p>{error ?? 'Tutor not found'}</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.layout}>
          <div className={styles.main}>
            {/* Profile Card */}
            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <Avatar
                  src={tutor.account?.profile_picture_url ?? null}
                  firstName={tutor.account?.first_name ?? ''}
                  lastName={tutor.account?.last_name ?? ''}
                  size="xl"
                />
                <div className={styles.profileInfo}>
                  <h1>{tutor.account?.first_name} {tutor.account?.last_name}</h1>
                  <div className={styles.meta}>
                    {tutor.city && (
                      <span><MapPin size={14} strokeWidth={1.5} /> {tutor.city.name}</span>
                    )}
                    {tutor.mode_of_tuition && (
                      <Badge variant="info">{SESSION_MODES[tutor.mode_of_tuition]}</Badge>
                    )}
                  </div>
                  {tutor.average_rating !== null && tutor.average_rating !== undefined && (
                    <div className={styles.ratingRow}>
                      <StarRating value={Math.round(tutor.average_rating)} readonly size={20} />
                      <span className={styles.ratingText}>
                        {tutor.average_rating.toFixed(1)} ({tutor.review_count})
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {tutor.bio && (
                <div className={styles.section}>
                  <h2>About</h2>
                  <p>{tutor.bio}</p>
                </div>
              )}
              {tutor.subjects && tutor.subjects.length > 0 && (
                <div className={styles.section}>
                  <h2>Subjects</h2>
                  <div className={styles.chips}>
                    {tutor.subjects.map((s) => (
                      <Chip key={s.id}>{s.subject_name} — {s.education_level_name}</Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Available Group Classes */}
            {classes.length > 0 && (
              <div className={styles.profileCard}>
                <h2 style={{ fontSize: 'var(--text-title-lg)', marginBottom: 'var(--space-4)' }}>
                  <Users size={20} strokeWidth={1.5} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  Available Group Classes
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {classes.map((c) => {
                    const spotsLeft = c.max_group_size ? c.max_group_size - (c.enrolled_count ?? 0) : null;
                    return (
                      <div
                        key={c.id}
                        style={{
                          background: 'var(--color-surface-low)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-5)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 'var(--space-4)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-body-md)', marginBottom: 4 }}>
                            {c.title}
                          </div>
                          <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                            <Clock size={13} strokeWidth={1.5} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            {formatDateTime(c.start_time)} &middot; {formatDuration(c.duration_minutes)}
                          </div>
                          {spotsLeft !== null && (
                            <div style={{ fontSize: 'var(--text-body-sm)', color: spotsLeft <= 2 ? 'var(--color-warning)' : 'var(--color-text-muted)', marginTop: 2 }}>
                              {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleJoinClass(c.id)}
                          loading={joiningId === c.id}
                          disabled={joinedIds.has(c.id) || (spotsLeft !== null && spotsLeft <= 0)}
                          variant={joinedIds.has(c.id) ? 'secondary' : 'primary'}
                          icon={joinedIds.has(c.id) ? <Check size={14} strokeWidth={1.5} /> : undefined}
                        >
                          {joinedIds.has(c.id) ? 'Joined' : 'Join Class'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className={styles.reviewsSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2>Reviews ({tutor.review_count})</h2>
                {!showReviewForm && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Star size={14} strokeWidth={1.5} />}
                    onClick={() => setShowReviewForm(true)}
                  >
                    Write a Review
                  </Button>
                )}
              </div>

              {tutor.review_count > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-4) var(--space-5)',
                    marginBottom: 'var(--space-4)',
                    background: 'var(--color-light-blue)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <Sparkles size={18} strokeWidth={1.5} style={{ color: 'var(--color-accent-blue)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <span style={{ fontSize: 'var(--text-label-md)', fontWeight: 600, color: 'var(--color-accent-blue)', display: 'block', marginBottom: 2 }}>
                      AI Summary
                    </span>
                    <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-body)', lineHeight: 1.5 }}>
                      {tutor.sentiment_summary ?? 'AI summary of all reviews'}
                    </span>
                  </div>
                </div>
              )}

              {showReviewForm && (
                <div
                  style={{
                    background: 'var(--color-surface-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-6)',
                    marginBottom: 'var(--space-4)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <h3 style={{ fontSize: 'var(--text-title-md)', marginBottom: 'var(--space-4)' }}>
                    Leave a Review
                  </h3>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-2)' }}>
                      Rating
                    </label>
                    <StarRating value={reviewRating} size={28} onChange={setReviewRating} />
                  </div>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <TextArea
                      label="Your review"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience with this tutor (min 10 characters)..."
                      rows={4}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-1)' }}>
                        How long have you studied with this tutor? (weeks)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={reviewWeeks}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setReviewWeeks(Number.isNaN(v) || v < 1 ? 1 : v);
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-surface-high)',
                          background: 'var(--color-surface)',
                          width: 100,
                        }}
                      />
                    </div>
                  </div>
                  <p style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                    {reviewText.length}/5000 characters (min 10)
                  </p>
                  {reviewError && (
                    <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-3)' }}>
                      {reviewError}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <Button
                      size="sm"
                      onClick={handleReviewSubmit}
                      loading={reviewSubmitting}
                      icon={<Send size={14} strokeWidth={1.5} />}
                    >
                      Submit Review
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { setShowReviewForm(false); setReviewError(null); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {reviews.length > 0 ? (
                <div className={styles.reviewList}>
                  {reviews.map((r) => {
                    const isOwn = r.student_id === account?.id;
                    const isEditing = editingReviewId === r.id;
                    const isSelected = selectedReviewId === r.id;

                    if (isEditing) {
                      return (
                        <div
                          key={r.id}
                          id={`review-${r.id}`}
                          className={styles.reviewCard}
                          style={{ boxShadow: '0 0 0 2px var(--color-primary-blue)' }}
                        >
                          <h3 style={{ fontSize: 'var(--text-title-md)', marginBottom: 'var(--space-4)' }}>
                            Edit Your Review
                          </h3>
                          <div style={{ marginBottom: 'var(--space-4)' }}>
                            <label style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-2)' }}>
                              Rating
                            </label>
                            <StarRating value={editRating} size={28} onChange={setEditRating} />
                          </div>
                          <div style={{ marginBottom: 'var(--space-3)' }}>
                            <TextArea
                              label="Your review"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <p style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                            {editText.length}/5000 characters (min 10)
                          </p>
                          {editError && (
                            <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-3)' }}>
                              {editError}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <Button size="sm" onClick={handleEditSubmit} loading={editSubmitting} icon={<Send size={14} strokeWidth={1.5} />}>
                              Save Changes
                            </Button>
                            <Button size="sm" variant="secondary" onClick={handleEditCancel} icon={<X size={14} strokeWidth={1.5} />}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={r.id}
                        id={`review-${r.id}`}
                        className={styles.reviewCard}
                        onClick={isOwn ? () => setSelectedReviewId(isSelected ? null : r.id) : undefined}
                        style={{
                          cursor: isOwn ? 'pointer' : undefined,
                          transition: 'box-shadow 0.2s ease',
                          ...(isOwn && isSelected ? { boxShadow: '0 0 0 2px var(--color-primary-blue)' } : {}),
                        }}
                      >
                        <div className={styles.reviewHeader}>
                          <Avatar
                            src={r.student_profile_picture}
                            firstName={r.student_name?.split(' ')[0] ?? ''}
                            lastName={r.student_name?.split(' ')[1] ?? ''}
                            size="sm"
                          />
                          <div style={{ flex: 1 }}>
                            <span className={styles.reviewerName}>
                              {r.student_name}
                              {isOwn && (
                                <span style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-primary-blue)', marginLeft: 'var(--space-2)', fontWeight: 400 }}>
                                  (You)
                                </span>
                              )}
                            </span>
                          </div>
                          <StarRating value={r.rating} readonly size={14} />
                        </div>
                        <p className={styles.reviewText}>{r.comment}</p>
                        {isOwn && isSelected && (
                          <div
                            style={{
                              display: 'flex',
                              gap: 'var(--space-3)',
                              marginTop: 'var(--space-4)',
                              paddingTop: 'var(--space-3)',
                              borderTop: '1px solid var(--color-surface-high)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button size="sm" variant="secondary" onClick={() => handleEditStart(r)} icon={<Pencil size={14} strokeWidth={1.5} />}>
                              Edit
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => setDeleteConfirmId(r.id)} icon={<Trash2 size={14} strokeWidth={1.5} />}>
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : !showReviewForm && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)' }}>
                  No reviews yet. Be the first to review this tutor!
                </p>
              )}

              <ConfirmDialog
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Review"
                message="Are you sure you want to delete your review? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
                loading={deleteLoading}
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className={styles.aside}>
            <div className={styles.pricingCard}>
              <h3>Pricing</h3>
              {tutor.individual_rate != null && (
                <div className={styles.priceRow}>
                  <DollarSign size={16} strokeWidth={1.5} />
                  <span>Individual: {formatCurrency(tutor.individual_rate, tutor.currency ?? 'USD')}/hr</span>
                </div>
              )}
              {tutor.group_rate != null && (
                <div className={styles.priceRow}>
                  <DollarSign size={16} strokeWidth={1.5} />
                  <span>Group: {formatCurrency(tutor.group_rate, tutor.currency ?? 'USD')}/hr</span>
                </div>
              )}
              <Button
                fullWidth
                size="lg"
                onClick={handleChat}
                loading={chatLoading}
                icon={<MessageCircle size={18} strokeWidth={1.5} />}
              >
                Contact Tutor
              </Button>
            </div>
            {tutor.working_hours && tutor.working_hours.length > 0 && (
              <div className={styles.hoursCard}>
                <h3>Working Hours</h3>
                {tutor.working_hours
                  .filter((wh) => wh.is_working)
                  .map((wh) => (
                    <div key={wh.day_of_week} className={styles.hourRow}>
                      <Clock size={14} strokeWidth={1.5} />
                      <span>{DAY_NAMES[wh.day_of_week]}</span>
                      <span className={styles.hourTime}>{wh.start_time} — {wh.end_time}</span>
                    </div>
                  ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}
