import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { resetDemoData } from '../../api/suppliers';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { QueryError } from '../../components/QueryError';
import stateStyles from '../../components/StoreStates.module.css';
import { useToast } from '../../components/ToastContext';
import { statusLabels, type SupplierStatus } from '../../data/suppliers';
import { adminKey, useSupplierSummary } from '../../hooks/useSuppliers';
import styles from './admin.module.css';

export function DashboardPage() {
  const summary = useSupplierSummary();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);

  const reset = useMutation({
    mutationFn: resetDemoData,
    onSuccess: async () => {
      setConfirming(false);
      await queryClient.invalidateQueries({ queryKey: adminKey });
      showToast('Demo data has been reset.');
    },
    onError: () => showToast("We couldn't reset the demo data.", 'error'),
  });

  return (
    <>
      <title>Dashboard | Valo Drinks</title>
      <div className={styles.titleRow}>
        <h1 className={styles.heading}>Dashboard</h1>
        <Link to="/admin/suppliers/new">Add a supplier</Link>
      </div>

      {summary.isPending && (
        <div
          className={`${stateStyles.skeleton} ${styles.skeletonTable}`}
          role="status"
          aria-label="Loading the dashboard"
        />
      )}

      {summary.isError && (
        <QueryError
          message="We couldn't load the dashboard."
          onRetry={() => void summary.refetch()}
          retrying={summary.isFetching}
        />
      )}

      {summary.data && (
        <div className={styles.cards}>
          <Link
            className={`${styles.card} ${styles.cardAlert}`}
            to="/admin/suppliers?risk=high&status=submitted"
          >
            <span className={styles.cardValue}>{summary.data.highRiskOpen}</span>
            High risk awaiting a decision
          </Link>
          {(Object.keys(statusLabels) as SupplierStatus[]).map((status) => (
            <Link key={status} className={styles.card} to={`/admin/suppliers?status=${status}`}>
              <span className={styles.cardValue}>{summary.data.byStatus[status]}</span>
              {statusLabels[status]}
            </Link>
          ))}
        </div>
      )}

      <section className={styles.demoPanel} aria-labelledby="demo-heading">
        <h2 id="demo-heading" className={styles.sectionHeading}>
          Demo data
        </h2>
        <p>Everyone using the demo shares this data. Reset it if it looks messy.</p>
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          Reset demo data
        </Button>
      </section>

      <Modal open={confirming} title="Reset demo data?" onClose={() => setConfirming(false)}>
        <p>This deletes every supplier and restores the sample data.</p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button onClick={() => reset.mutate()} disabled={reset.isPending}>
            {reset.isPending ? 'Resetting…' : 'Reset'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
