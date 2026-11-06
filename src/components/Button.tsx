import type { ComponentPropsWithRef } from 'react';
import styles from './Button.module.css';

type Props = ComponentPropsWithRef<'button'> & { variant?: 'primary' | 'secondary' };

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button type="button" className={`${styles.button} ${className}`} data-variant={variant} {...props} />
  );
}

/** For links that should look like a button. */
export const buttonClass = styles.button;
