import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { TextArea } from './TextArea';
import styles from './ConfirmAction.module.css';

interface ConfirmActionProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
}

export function ConfirmAction({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}: ConfirmActionProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }
    setError('');
    await onConfirm(reason.trim());
    setReason('');
  };

  const handleClose = () => {
    if (loading) return;
    setReason('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.closeBtn} onClick={handleClose} disabled={loading}>
              <X size={18} />
            </button>

            <div className={`${styles.iconWrapper} ${styles[variant]}`}>
              <AlertTriangle size={24} />
            </div>

            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>

            <TextArea
              label="Reason (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this action is being taken..."
              error={error}
            />

            <div className={styles.actions}>
              <Button variant="secondary" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                onClick={handleConfirm}
                loading={loading}
                disabled={reason.trim().length < 10}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
