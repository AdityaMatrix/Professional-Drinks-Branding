import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { useCart } from '../cart/CartContext';
import { canTransitionName, formatPrice, getProductImage, type Product } from '../data/products';
import { Button } from './Button';
import { StockLabel } from './StockLabel';
import styles from './ProductCard.module.css';

export function ProductCard({ product }: { product: Product }) {
  const { items, add } = useCart();
  const inCart = items[product.id] ?? 0;
  const atLimit = inCart >= product.stock;

  return (
    <article className={styles.card} style={{ '--drink': product.color } as CSSProperties}>
      <div className={styles.imageBox}>
        <img
          className={styles.image}
          style={{ viewTransitionName: canTransitionName(product.id) }}
          src={getProductImage(product)}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>
      <h2 className={styles.name}>
        <Link to={`/products/${product.id}`} viewTransition>
          {product.name}
        </Link>
      </h2>
      <p className={styles.price}>{formatPrice(product.priceCents)}</p>
      <StockLabel stock={product.stock} />
      <Button
        className={styles.add}
        onClick={() => add(product.id, product.stock)}
        disabled={atLimit}
        aria-label={`Add ${product.name} to cart`}
      >
        {product.stock === 0 ? 'Sold out' : atLimit ? 'All in cart' : 'Add to cart'}
      </Button>
    </article>
  );
}
