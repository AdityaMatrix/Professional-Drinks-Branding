import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import background from '../assets/images/bg-login.webp';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import styles from './LoginPage.module.css';

const loginSchema = z.object({
  email: z.string().trim().pipe(z.email('Enter a valid email address')),
  password: z.string().min(1, 'Enter your password'),
});
type LoginValues = z.infer<typeof loginSchema>;

const demoEmail = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
const demoPassword = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;

/** Only same-site paths, so a crafted link can't send someone to another website after login. */
export function safeNextPath(next: string | null) {
  return next?.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
    ? next
    : '/admin';
}

export function LoginPage() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const [failure, setFailure] = useState('');
  const [demoPending, setDemoPending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  if (auth.status === 'signedIn') return <Navigate to={safeNextPath(params.get('next'))} replace />;

  const attempt = async (email: string, password: string) => {
    setFailure('');
    try {
      await auth.signIn(email, password);
    } catch (error) {
      const invalid = (error as { code?: string }).code === 'invalid_credentials';
      setFailure(
        invalid ? 'That email or password is wrong.' : "We couldn't sign you in. Please try again.",
      );
    }
  };

  const signInAsDemo = async () => {
    if (!demoEmail || !demoPassword) return;
    setDemoPending(true);
    await attempt(demoEmail, demoPassword);
    setDemoPending(false);
  };

  const busy = isSubmitting || demoPending;

  return (
    <div className={styles.page}>
      <title>Log in | Valo Drinks</title>
      <img className={styles.background} src={background} alt="" fetchPriority="high" />
      <div className={styles.panel}>
        <h1 className={styles.heading}>Supplier portal</h1>
        <p>Staff only. Review supplier onboarding, risk and compliance.</p>

        {demoEmail && demoPassword && (
          <div className={styles.demo}>
            <p>
              <strong>Just looking around?</strong> The demo uses sample data that anyone can edit
              and reset.
            </p>
            <Button onClick={() => void signInAsDemo()} disabled={busy}>
              {demoPending ? 'Signing in…' : 'Try the demo'}
            </Button>
          </div>
        )}

        <form
          className={styles.form}
          onSubmit={handleSubmit(({ email, password }) => attempt(email, password))}
          noValidate
        >
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" variant="secondary" disabled={busy}>
            {isSubmitting ? 'Signing in…' : 'Log in'}
          </Button>
          <p className={styles.failure} role="alert">
            {failure}
          </p>
        </form>
      </div>
    </div>
  );
}
