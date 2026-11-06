import { Link } from 'react-router';
import { QuoteRejectedError, type Quote } from '../../api/orders';
import { QueryError } from '../../components/QueryError';
import stateStyles from '../../components/StoreStates.module.css';
import { formatPrice } from '../../data/products';
import { useQuote } from '../../hooks/useQuote';
import styles from './checkout.module.css';

export function OrderTotals({ quote }: { quote: Quote }) {
  return (
    <>
      <ul className={styles.summaryLines}>
        {quote.lines.map((line) => (
          <li key={line.id}>
            <span>
              {line.name} × {line.quantity}
            </span>
            <span>{formatPrice(line.lineCents)}</span>
          </li>
        ))}
      </ul>
      <dl className={styles.totals}>
        <dt>Subtotal</dt>
        <dd>{formatPrice(quote.subtotalCents)}</dd>
        <dt>Shipping</dt>
        <dd>{quote.shippingCents === 0 ? 'Free' : formatPrice(quote.shippingCents)}</dd>
        <dt className={styles.total}>Total</dt>
        <dd className={styles.total}>{formatPrice(quote.totalCents)}</dd>
      </dl>
    </>
  );
}

export function OrderSummary() {
  const quote = useQuote();

  return (
    <aside className={styles.summary} aria-labelledby="summary-heading">
      <h2 id="summary-heading" className={styles.sectionHeading}>
        Your order
      </h2>

      {quote.isPending && (
        <div
          className={`${stateStyles.skeleton} ${styles.skeleton}`}
          role="status"
          aria-label="Loading your order"
        />
      )}

      {quote.error instanceof QuoteRejectedError && (
        <div role="alert">
          <p>{quote.error.message}</p>
          <Link className={styles.link} to="/cart">
            Back to your cart
          </Link>
        </div>
      )}

      {quote.isError && !(quote.error instanceof QuoteRejectedError) && (
        <QueryError
          message="We couldn't price your order."
          onRetry={() => void quote.refetch()}
          retrying={quote.isFetching}
        />
      )}

      {quote.data && <OrderTotals quote={quote.data} />}
    </aside>
  );
}
