import { Link, useParams } from 'react-router';
import { useCart } from '../cart/CartContext';
import { Button } from '../components/Button';
import { QueryError } from '../components/QueryError';
import { StockLabel } from '../components/StockLabel';
import stateStyles from '../components/StoreStates.module.css';
import { formatPrice, getProductImage, type Product } from '../data/products';
import { useProduct } from '../hooks/useProducts';
import styles from './ProductDetailPage.module.css';

function ProductDetails({ product }: { product: Product }) {
  const { items, add } = useCart();
  const inCart = items[product.id] ?? 0;
  const atLimit = inCart >= product.stock;

  return (
    <div className={styles.layout}>
      <title>{`${product.name} | Valo Drinks`}</title>
      <div className={styles.imageBox} style={{ backgroundColor: product.color }}>
        <img
          className={styles.image}
          src={getProductImage(product)}
          alt={`${product.name} can featuring ${product.agent}`}
        />
      </div>
      <div className={styles.info}>
        <h1 className={styles.name}>{product.name}</h1>
        <p className={styles.price}>{formatPrice(product.priceCents)}</p>
        <StockLabel stock={product.stock} />
        <p>{product.description}</p>
        <Button onClick={() => add(product.id, product.stock)} disabled={atLimit}>
          {product.stock === 0 ? 'Sold out' : atLimit ? 'All in cart' : 'Add to cart'}
        </Button>
        <p role="status">{inCart > 0 && `${inCart} in your cart`}</p>
      </div>
    </div>
  );
}

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const product = useProduct(id);

  return (
    <div className={styles.page}>
      <Link to="/products">Back to shop</Link>

      {product.isPending && (
        <div
          className={`${stateStyles.skeleton} ${styles.skeleton}`}
          role="status"
          aria-label="Loading drink"
        />
      )}

      {product.isError && (
        <QueryError
          message="We couldn't load this drink."
          onRetry={() => void product.refetch()}
          retrying={product.isFetching}
        />
      )}

      {product.isSuccess && !product.data && (
        <div className={stateStyles.state}>
          <h1>Drink not found</h1>
          <p>We don&apos;t have a drink at this address.</p>
        </div>
      )}

      {product.data && <ProductDetails product={product.data} />}
    </div>
  );
}
