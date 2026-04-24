import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, ShieldBan, ShieldCheck, Trash2, Mail, Calendar, Clock } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getAccount, restrictAccount, unrestrictAccount, deleteAccount } from '@/services/accountService';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import styles from './AccountDetail.module.css';

type ConfirmMode = 'restrict' | 'unrestrict' | 'delete' | null;

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetcher = useCallback(() => getAccount(id!), [id]);
  const { data: account, loading, error, refetch } = useApi(fetcher, [id]);

  usePageTitle(account ? `${account.first_name} ${account.last_name}` : 'Account');

  const handleAction = async (reason: string) => {
    if (!id || !confirmMode) return;
    setActionLoading(true);
    try {
      if (confirmMode === 'restrict') await restrictAccount(id, reason);
      else if (confirmMode === 'unrestrict') await unrestrictAccount(id, reason);
      else if (confirmMode === 'delete') {
        await deleteAccount(id, reason);
        navigate('/accounts');
        return;
      }
      setConfirmMode(null);
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

  if (error || !account) {
    return (
      <>
        <AdminHeader title="Account not found" />
        <div className={styles.content}>
          <Button variant="ghost" onClick={() => navigate('/accounts')}>
            <ArrowLeft size={16} /> Back to accounts
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title={`${account.first_name} ${account.last_name}`}
        subtitle={account.email}
        actions={
          <Button variant="ghost" onClick={() => navigate('/accounts')}>
            <ArrowLeft size={16} /> Back
          </Button>
        }
      />

      <div className={styles.content}>
        <div className={styles.layout}>
          <div className={styles.profileCard}>
            <div className={styles.avatar}>
              {account.first_name[0]}
              {account.last_name[0]}
            </div>
            <h2 className={styles.fullName}>
              {account.first_name} {account.last_name}
            </h2>
            <div className={styles.badges}>
              <Badge variant="info">{account.account_type}</Badge>
              {account.is_restricted ? (
                <Badge variant="error">Restricted</Badge>
              ) : (
                <Badge variant="success">Active</Badge>
              )}
              {account.is_email_verified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
            </div>
          </div>

          <div className={styles.detailsCard}>
            <h3 className={styles.sectionTitle}>Account Information</h3>
            <div className={styles.fields}>
              <div className={styles.field}>
                <Mail size={14} strokeWidth={1.5} />
                <span className={styles.fieldLabel}>Email</span>
                <span className={styles.fieldValue}>{account.email}</span>
              </div>
              <div className={styles.field}>
                <Calendar size={14} strokeWidth={1.5} />
                <span className={styles.fieldLabel}>Created</span>
                <span className={styles.fieldValue}>
                  {format(new Date(account.created_at), 'MMMM d, yyyy')}
                </span>
              </div>
              <div className={styles.field}>
                <Clock size={14} strokeWidth={1.5} />
                <span className={styles.fieldLabel}>Last Login</span>
                <span className={styles.fieldValue}>
                  {account.last_login_at
                    ? format(new Date(account.last_login_at), 'MMMM d, yyyy HH:mm')
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.actionsCard}>
            <h3 className={styles.sectionTitle}>Actions</h3>
            <div className={styles.actionButtons}>
              {account.is_restricted ? (
                <Button
                  variant="primary"
                  onClick={() => setConfirmMode('unrestrict')}
                >
                  <ShieldCheck size={16} /> Unrestrict Account
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => setConfirmMode('restrict')}
                >
                  <ShieldBan size={16} /> Restrict Account
                </Button>
              )}
              <Button variant="danger" onClick={() => setConfirmMode('delete')}>
                <Trash2 size={16} /> Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmAction
        open={confirmMode === 'restrict'}
        onClose={() => setConfirmMode(null)}
        onConfirm={handleAction}
        title="Restrict Account"
        description={`This will restrict ${account.first_name}'s account. They will be unable to create new content or appear in search results.`}
        confirmLabel="Restrict"
        variant="warning"
        loading={actionLoading}
      />

      <ConfirmAction
        open={confirmMode === 'unrestrict'}
        onClose={() => setConfirmMode(null)}
        onConfirm={handleAction}
        title="Unrestrict Account"
        description={`This will restore full access for ${account.first_name}'s account.`}
        confirmLabel="Unrestrict"
        variant="warning"
        loading={actionLoading}
      />

      <ConfirmAction
        open={confirmMode === 'delete'}
        onClose={() => setConfirmMode(null)}
        onConfirm={handleAction}
        title="Delete Account"
        description={`This will permanently delete ${account.first_name}'s account. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
        loading={actionLoading}
      />
    </>
  );
}
