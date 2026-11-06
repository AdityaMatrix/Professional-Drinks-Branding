import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  deleteSupplierDraft,
  SupplierRejectedError,
  transitionSupplier,
} from '../../api/suppliers';
import { RiskBadge, StatusBadge } from '../../components/Badge';
import { Button, buttonClass } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { QueryError } from '../../components/QueryError';
import stateStyles from '../../components/StoreStates.module.css';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/ToastContext';
import {
  categoryLabels,
  formatDateTime,
  statusLabels,
  transitions,
  type Supplier,
  type SupplierStatus,
} from '../../data/suppliers';
import { adminKey, useSupplier, useSupplierEvents } from '../../hooks/useSuppliers';
import styles from './admin.module.css';

const yesNoLabel = (value: boolean | null) => (value === null ? '—' : value ? 'Yes' : 'No');

function History({ id }: { id: string }) {
  const events = useSupplierEvents(id);

  if (events.isPending) return <p role="status">Loading history…</p>;
  if (events.isError) {
    return (
      <QueryError
        message="We couldn't load the history."
        onRetry={() => void events.refetch()}
        retrying={events.isFetching}
      />
    );
  }

  return (
    <ol className={styles.timeline}>
      {events.data.map((event) => (
        <li key={event.id}>
          <p>
            <strong>{statusLabels[event.toStatus]}</strong>
          </p>
          {event.note && <p>{event.note}</p>}
          <p className={styles.timelineMeta}>
            {event.actor} · {formatDateTime(event.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}

function SupplierActions({ supplier }: { supplier: Supplier }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');

  const refresh = () => queryClient.invalidateQueries({ queryKey: adminKey });

  const transition = useMutation({
    mutationFn: transitionSupplier,
    onSuccess: async (_result, { toStatus }) => {
      setRejecting(false);
      setNote('');
      await refresh();
      showToast(`Status changed to ${statusLabels[toStatus]}.`);
    },
    onError: async (error) => {
      setRejecting(false);
      // On a conflict, show what's true now so the next decision isn't based on old data.
      if (error instanceof SupplierRejectedError) {
        if (error.stale) await refresh();
        showToast(error.message, 'error');
      } else {
        showToast("We couldn't change the status. Please try again.", 'error');
      }
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteSupplierDraft(supplier.id),
    onSuccess: async () => {
      await navigate('/admin/suppliers', { replace: true });
      await refresh();
      showToast('Draft deleted.');
    },
    onError: async (error) => {
      setConfirmingDelete(false);
      await refresh();
      showToast(
        error instanceof SupplierRejectedError ? error.message : "We couldn't delete the draft.",
        'error',
      );
    },
  });

  const move = (toStatus: SupplierStatus, reason?: string) =>
    transition.mutate({
      id: supplier.id,
      expectedStatus: supplier.status,
      toStatus,
      note: reason,
    });

  const submitRejection = () => {
    if (!note.trim()) {
      setNoteError('Enter a reason');
      return;
    }
    move('rejected', note);
  };

  return (
    <div className={styles.actions}>
      {supplier.status === 'draft' && (
        <>
          <Link className={buttonClass} to={`/admin/suppliers/${supplier.id}/onboarding`}>
            Continue onboarding
          </Link>
          <Button variant="secondary" onClick={() => setConfirmingDelete(true)}>
            Delete draft
          </Button>
        </>
      )}
      {transitions[supplier.status]?.map((option) => (
        <Button
          key={option.to}
          variant={option.needsNote ? 'secondary' : 'primary'}
          disabled={transition.isPending}
          onClick={() => {
            if (option.needsNote) setRejecting(true);
            else move(option.to);
          }}
        >
          {option.label}
        </Button>
      ))}

      <Modal open={rejecting} title="Reject supplier" onClose={() => setRejecting(false)}>
        <TextField
          label="Reason"
          multiline
          value={note}
          error={noteError}
          onChange={(event) => {
            setNote(event.target.value);
            setNoteError('');
          }}
        />
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
          <Button onClick={submitRejection} disabled={transition.isPending}>
            {transition.isPending ? 'Rejecting…' : 'Reject supplier'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmingDelete}
        title="Delete this draft?"
        onClose={() => setConfirmingDelete(false)}
      >
        <p>{supplier.name} and its answers will be removed.</p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
            Cancel
          </Button>
          <Button onClick={() => remove.mutate()} disabled={remove.isPending}>
            {remove.isPending ? 'Deleting…' : 'Delete draft'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function SupplierDetailPage() {
  const { id = '' } = useParams();
  const supplier = useSupplier(id);

  if (supplier.isPending) {
    return (
      <div
        className={`${stateStyles.skeleton} ${styles.skeletonTable}`}
        role="status"
        aria-label="Loading supplier"
      />
    );
  }

  if (supplier.isError) {
    return (
      <QueryError
        message="We couldn't load this supplier."
        onRetry={() => void supplier.refetch()}
        retrying={supplier.isFetching}
      />
    );
  }

  if (!supplier.data) {
    return (
      <div className={stateStyles.state}>
        <h1>Supplier not found</h1>
        <Link to="/admin/suppliers">Back to suppliers</Link>
      </div>
    );
  }

  const data = supplier.data;

  return (
    <>
      <title>{`${data.name} | Valo Drinks`}</title>
      <Link to="/admin/suppliers">Back to suppliers</Link>
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.heading}>{data.name}</h1>
          <div className={styles.badges}>
            <StatusBadge status={data.status} />
            <RiskBadge level={data.riskLevel} />
          </div>
        </div>
        <SupplierActions supplier={data} />
      </div>

      <div className={styles.detailGrid}>
        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className={styles.sectionHeading}>
            Details
          </h2>
          <dl className={styles.details}>
            <dt>Category</dt>
            <dd>{categoryLabels[data.category]}</dd>
            <dt>Country</dt>
            <dd>{data.country}</dd>
            <dt>Contact</dt>
            <dd>{data.contactName ?? '—'}</dd>
            <dt>Email</dt>
            <dd>{data.contactEmail ?? '—'}</dd>
          </dl>
        </section>

        <section aria-labelledby="compliance-heading">
          <h2 id="compliance-heading" className={styles.sectionHeading}>
            Compliance
          </h2>
          <dl className={styles.details}>
            <dt>Certifications</dt>
            <dd>{data.certifications.join(', ') || 'None'}</dd>
            <dt>Insured</dt>
            <dd>{yesNoLabel(data.hasInsurance)}</dd>
            <dt>Audited last year</dt>
            <dd>{yesNoLabel(data.auditedLastYear)}</dd>
            <dt>Handles allergens</dt>
            <dd>{yesNoLabel(data.handlesAllergens)}</dd>
            <dt>Risk score</dt>
            <dd>{data.riskScore === null ? 'Calculated on submission' : `${data.riskScore} / 100`}</dd>
          </dl>
        </section>

        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className={styles.sectionHeading}>
            History
          </h2>
          <History id={data.id} />
        </section>
      </div>
    </>
  );
}
