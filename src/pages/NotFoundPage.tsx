import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
      <h1>Page not found</h1>
      <p>
        That page doesn&apos;t exist. <Link to="/">Back to the home page</Link>
      </p>
    </div>
  );
}
