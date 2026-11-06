import {
  riskLabels,
  statusLabels,
  type RiskLevel,
  type SupplierStatus,
} from '../data/suppliers';
import styles from './Badge.module.css';

export function StatusBadge({ status }: { status: SupplierStatus }) {
  return (
    <span className={styles.badge} data-tone={status}>
      {statusLabels[status]}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel | null }) {
  if (!level) return <span className={styles.none}>Not assessed</span>;
  return (
    <span className={styles.badge} data-tone={`risk-${level}`}>
      {riskLabels[level]} risk
    </span>
  );
}
