import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { sendContactMessage } from '../api/contact';
import { contactSchema, type ContactValues } from '../data/contactSchema';
import { TextField } from './TextField';
import styles from './ContactForm.module.css';

type SubmitStatus = 'idle' | 'sent' | 'failed';

export function ContactForm() {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactValues) => {
    setStatus('idle');
    try {
      await sendContactMessage(values);
      reset();
      setStatus('sent');
    } catch {
      // Values stay in the form, so a failed send never costs someone their message.
      setStatus('failed');
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
        {status === 'sent' && 'Thanks, your message has been sent.'}
        {status === 'failed' && 'Your message could not be sent. Please try again.'}
      </p>
    </form>
  );
}
