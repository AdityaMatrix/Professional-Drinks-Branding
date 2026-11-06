import { Link } from 'react-router';
import { useCart } from '../cart/CartContext';
import { Button, buttonClass } from '../components/Button';
import { QueryError } from '../components/QueryError';
import stateStyles from '../components/StoreStates.module.css';
import {
  canTransitionName,
  defaultFilters,
  formatPrice,
  getProductImage,
  type Product,
} from '../data/products';
import { useProducts } from '../hooks/useProducts';
import styles from './CartPage.module.css';

function CartLine({ product, quantity }: { product: Product; quantity: number }) {
  const { setQuantity, remove } = useCart();
  const overStock = quantity > product.stock;

  return (
    <li className={styles.line}>
      <img
        className={styles.image}
        style={{ viewTransitionName: canTransitionName(product.id) }}
        src={getProductImage(product)}
        alt=""
      />
      <div className={styles.details}>
        <Link className={styles.name} to={`/products/${product.id}`} viewTransition>
          {product.name}
        </Link>
        <p>{formatPrice(product.priceCents)} each</p>
        {overStock && (
          <p className={styles.warning}>
            {product.stock === 0 ? 'Now sold out.' : `Only ${product.stock} left.`}{' '}
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => setQuantity(product.id, product.stock, product.stock)}
            >
              {product.stock === 0 ? 'Remove it' : `Change to ${product.stock}`}
            </button>
          </p>
        )}
      </div>
      <div className={styles.stepper}>
        <Button
          variant="secondary"
          aria-label={`Remove one ${product.name}`}
          onClick={() => setQuantity(product.id, quantity - 1, Math.max(product.stock, quantity))}
        >
          −
        </Button>
        <span aria-label={`Quantity of ${product.name}`}>{quantity}</span>
        <Button
          variant="secondary"
          aria-label={`Add one ${product.name}`}
          disabled={quantity >= product.stock}
          onClick={() => setQuantity(product.id, quantity + 1, product.stock)}
        >
          +
        </Button>
      </div>
      <p className={styles.lineTotal}>{formatPrice(product.priceCents * quantity)}</p>
      <button
        type="button"
        className={styles.linkButton}
        aria-label={`Remove ${product.name} from cart`}
        onClick={() => remove(product.id)}
      >
        Remove
      </button>
    </li>
  );
}

export function CartPage() {
  const { items, remove } = useCart();
  const products = useProducts(defaultFilters);
  const ids = Object.keys(items);

  const catalogue = new Map(products.data?.map((product) => [product.id, product]));
  const lines = ids.flatMap((id) => {
    const product = catalogue.get(id);
    return product ? [{ product, quantity: items[id] ?? 0 }] : [];
  });
  const missing = products.isSuccess ? ids.filter((id) => !catalogue.has(id)) : [];
  const subtotal = lines.reduce(
    (total, { product, quantity }) =>
      total + product.priceCents * Math.min(quantity, product.stock),
    0,
  );

  const canCheckOut =
    missing.length === 0 && lines.every(({ product, quantity }) => quantity <= product.stock);

  return (
    <div className={styles.page}>
      <title>Cart | Valo Drinks</title>
      <h1 className={styles.heading}>Your cart</h1>

      {ids.length === 0 && (
        <div className={stateStyles.state}>
          <p>Your cart is empty.</p>
          <Link className={buttonClass} to="/products">
            Browse drinks
          </Link>
        </div>
      )}

      {ids.length > 0 && products.isPending && (
        <div
          className={`${stateStyles.skeleton} ${styles.skeleton}`}
          role="status"
          aria-label="Loading your cart"
        />
      )}

      {ids.length > 0 && products.isError && (
        <QueryError
          message="We couldn't load the items in your cart. They're still saved."
          onRetry={() => void products.refetch()}
          retrying={products.isFetching}
        />
      )}

      {ids.length > 0 && products.isSuccess && (
        <>
          <ul className={styles.lines}>
            {lines.map(({ product, quantity }) => (
              <CartLine key={product.id} product={product} quantity={quantity} />
            ))}
          </ul>

          {missing.length > 0 && (
            <p className={styles.warning}>
              {missing.length === 1 ? 'One item is' : `${missing.length} items are`} no longer
              available.{' '}
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => missing.forEach(remove)}
              >
                Remove {missing.length === 1 ? 'it' : 'them'}
              </button>
            </p>
          )}

          <p className={styles.subtotal}>Subtotal: {formatPrice(subtotal)}</p>
          <div className={styles.checkout}>
            {canCheckOut ? (
              <Link className={buttonClass} to="/checkout">
                Go to checkout
              </Link>
            ) : (
              <p className={styles.warning}>Fix the items above to continue to checkout.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
