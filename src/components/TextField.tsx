import { useId, type ComponentPropsWithRef } from 'react';
import styles from './TextField.module.css';

type Props = ComponentPropsWithRef<'input'> & {
  label: string;
  error?: string;
  multiline?: boolean;
};

export function TextField({ label, error, multiline = false, ref, ...inputProps }: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  const shared = {
    id,
    className: styles.input,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  };

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          {...(inputProps as ComponentPropsWithRef<'textarea'>)}
          {...shared}
          ref={ref as ComponentPropsWithRef<'textarea'>['ref']}
          rows={4}
        />
      ) : (
        <input {...inputProps} {...shared} ref={ref} />
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
