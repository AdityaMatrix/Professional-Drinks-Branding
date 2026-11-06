import background from '../assets/images/bg-contact.webp';
import { ContactForm } from './ContactForm';
import styles from './ContactSection.module.css';

export function ContactSection() {
  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-heading">
      <img className={styles.background} src={background} alt="" loading="lazy" decoding="async" />
      <div className={styles.box}>
        <div className={styles.left}>
          <h2 id="contact-heading" className={styles.heading}>
            Send your message
          </h2>
          <ContactForm />
        </div>
        <div className={styles.right}>
          <h2 className={styles.heading}>Reach us</h2>
          <dl className={styles.details}>
            <dt>Email</dt>
            <dd>valo@mail.com</dd>
            <dt>Phone</dt>
            <dd>5698152</dd>
          </dl>
        </div>
      </div>
    </section>
  );
}
