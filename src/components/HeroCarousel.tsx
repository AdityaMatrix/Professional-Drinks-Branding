import type { FocusEvent } from 'react';
import { Link } from 'react-router';
import {
  canSize,
  canTransitionName,
  formatPrice,
  getProductImage,
  type Product,
} from '../data/products';
import { getSlot } from '../hooks/carouselState';
import { useCarousel } from '../hooks/useCarousel';
import { buttonClass } from './Button';
import styles from './HeroCarousel.module.css';

type Props = { products: Product[]; initialIndex?: number };

export function HeroCarousel({ products, initialIndex = 1 }: Props) {
  const carousel = useCarousel(products.length, initialIndex);
  const { state, pausedByUser, isPlaying } = carousel;

  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    // Only keyboard focus pauses. A clicked button keeps focus, which would stop autoplay for good.
    if (event.target.matches(':focus-visible')) carousel.setFocused(true);
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    // Focus moving between controls stays inside, so only count it when it really leaves.
    if (!event.currentTarget.contains(event.relatedTarget)) carousel.setFocused(false);
  };

  return (
    <section
      id="home"
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label="Our drinks"
      data-direction={state.direction}
      data-parity={state.step % 2 === 0 ? 'even' : 'odd'}
      onMouseEnter={() => carousel.setHovered(true)}
      onMouseLeave={() => carousel.setHovered(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className={styles.list} aria-live={isPlaying ? 'off' : 'polite'}>
        {products.map((product, index) => {
          const slot = getSlot(index, state, products.length);
          return (
            <article
              key={product.id}
              className={styles.slide}
              data-slot={slot}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${products.length}`}
              inert={slot !== 'active'}
            >
              <div className={styles.panel} style={{ backgroundColor: product.color }}>
                <div className={styles.content}>
                  <h2 className={styles.name}>{product.name}</h2>
                  <p className={styles.price}>{formatPrice(product.priceCents)}</p>
                  <p className={styles.description}>{product.description}</p>
                  <Link
                    className={`${buttonClass} ${styles.shop}`}
                    to={`/products/${product.id}`}
                    viewTransition
                  >
                    View {product.name}
                  </Link>
                </div>
              </div>
              <figure className={styles.figure}>
                <img
                  className={styles.can}
                  style={{
                    viewTransitionName: slot === 'active' ? canTransitionName(product.id) : 'none',
                  }}
                  src={getProductImage(product)}
                  alt={`${product.name} can featuring ${product.agent}`}
                  {...canSize}
                  decoding="async"
                  fetchPriority={index === initialIndex ? 'high' : 'auto'}
                />
              </figure>
            </article>
          );
        })}
      </div>

      <div className={styles.controls}>
        <button type="button" onClick={carousel.prev} aria-label="Previous drink">
          <span aria-hidden="true">&lt;</span>
        </button>
        <button
          type="button"
          onClick={carousel.togglePaused}
          aria-label={pausedByUser ? 'Play slideshow' : 'Pause slideshow'}
        >
          <span aria-hidden="true">{pausedByUser ? '▶' : '❚❚'}</span>
        </button>
        <button type="button" onClick={carousel.next} aria-label="Next drink">
          <span aria-hidden="true">&gt;</span>
        </button>
      </div>
    </section>
  );
}
