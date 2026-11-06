import { useId, type ComponentPropsWithRef } from 'react';
import styles from './TextField.module.css';

type Props = ComponentPropsWithRef<'select'> & { label: string; error?: string };

export function SelectField({ label, error, children, ...selectProps }: Props) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <select
        {...selectProps}
        id={id}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
