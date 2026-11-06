import background from '../assets/images/bg-about.webp';
import { useTypewriter } from '../hooks/useTypewriter';
import styles from './AboutSection.module.css';

const phrases = ['Rule Your Fears', 'Defy The Limits', 'We Are Valorant!'];

export function AboutSection() {
  const text = useTypewriter(phrases);

  return (
    <section id="about" className={styles.section} aria-labelledby="about-heading">
      <img className={styles.background} src={background} alt="" loading="lazy" decoding="async" />
      <h2 id="about-heading" className="visually-hidden">
        About us
      </h2>
      {/* Screen readers get the phrases once, not a letter-by-letter stream. */}
      <p className="visually-hidden">{phrases.join('. ')}</p>
      <p className={styles.tagline} aria-hidden="true">
        {text}
        <span className={styles.cursor}>|</span>
      </p>
    </section>
  );
}
