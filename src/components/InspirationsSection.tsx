import { useState } from 'react';
import { agents } from '../data/agents';
import styles from './InspirationsSection.module.css';

export function InspirationsSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="inspirations" className={styles.section} aria-labelledby="inspirations-heading">
      <h2 id="inspirations-heading" className={styles.heading}>
        Our Inspirations
      </h2>
      <ul className={styles.gallery}>
        {agents.map((agent) => {
          const isOpen = openId === agent.id;
          return (
            <li key={agent.id} className={styles.item} data-open={isOpen}>
              {/* A real button, so the bio works by tap and keyboard as well as hover. */}
              <button
                type="button"
                className={styles.card}
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : agent.id)}
              >
                <img
                  className={styles.photo}
                  src={agent.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span className={styles.text}>
                  <span className={styles.name}>{agent.name}</span>
                  <span className={styles.bio}>{agent.bio}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
