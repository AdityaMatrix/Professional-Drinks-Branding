import { LOW_STOCK_LIMIT } from '../data/products';
import styles from './StockLabel.module.css';

export function StockLabel({ stock }: { stock: number }) {
  if (stock === 0) return <p className={styles.soldOut}>Sold out</p>;
  if (stock <= LOW_STOCK_LIMIT) return <p className={styles.low}>Only {stock} left</p>;
  return <p className={styles.inStock}>In stock</p>;
}
