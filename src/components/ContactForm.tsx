import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ContactRejectedError, sendContactMessage } from '../api/contact';
import { contactSchema, type ContactValues } from '../data/contactSchema';
import { TextField } from './TextField';
import styles from './ContactForm.module.css';

const SENT = 'Thanks, your message has been sent.';
const FAILED = 'Your message could not be sent. Please try again.';

export function ContactForm() {
  const [status, setStatus] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactValues) => {
    setStatus('');
    try {
      await sendContactMessage(values);
      reset();
      setStatus(SENT);
    } catch (error) {
      // Values stay in the form, so a failed send never costs someone their message.
      if (!(error instanceof ContactRejectedError)) setStatus(FAILED);
      else if (error.field) setError(error.field, { message: error.message }, { shouldFocus: true });
      else setStatus(error.message);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.row}>
        <TextField
          label="Name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>
      <div className={styles.row}>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField label="Subject" error={errors.subject?.message} {...register('subject')} />
      </div>
      <TextField label="Message" multiline error={errors.message?.message} {...register('message')} />

      <button className={styles.submit} type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send message'}
      </button>

      <p className={styles.status} role="status">
        {status}
      </p>
    </form>
  );
}
