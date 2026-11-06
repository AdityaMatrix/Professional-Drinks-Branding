import type { FocusEvent } from 'react';
import type { Drink } from '../data/drinks';
import { getSlot } from '../hooks/carouselState';
import { useCarousel } from '../hooks/useCarousel';
import styles from './HeroCarousel.module.css';

type Props = { drinks: Drink[]; initialIndex?: number };

export function HeroCarousel({ drinks, initialIndex = 1 }: Props) {
  const carousel = useCarousel(drinks.length, initialIndex);
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
        {drinks.map((drink, index) => {
          const slot = getSlot(index, state, drinks.length);
          return (
            <article
              key={drink.id}
              className={styles.slide}
              data-slot={slot}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${drinks.length}`}
              inert={slot !== 'active'}
            >
              <div className={styles.panel} style={{ backgroundColor: drink.color }}>
                <div className={styles.content}>
                  <h2 className={styles.name}>{drink.name}</h2>
                  <p className={styles.price}>${drink.priceUsd}</p>
                  <p className={styles.description}>{drink.description}</p>
                </div>
              </div>
              <figure className={styles.figure}>
                <img
                  className={styles.can}
                  src={drink.image}
                  alt={drink.imageAlt}
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
