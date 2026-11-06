import { Button } from './Button';
import styles from './StoreStates.module.css';

type Props = { message: string; onRetry: () => void; retrying: boolean };

export function QueryError({ message, onRetry, retrying }: Props) {
  return (
    <div className={styles.state} role="alert">
      <p>{message}</p>
      <Button onClick={onRetry} disabled={retrying}>
        {retrying ? 'Trying again…' : 'Try again'}
      </Button>
    </div>
  );
}
