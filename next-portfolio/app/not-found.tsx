import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'var(--font-body)',
      background: 'var(--color-bg)',
      color: 'var(--color-text)',
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>404</h1>
      <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>Page not found</p>
      <Link href="/" style={{
        padding: '0.75rem 1.5rem',
        background: 'var(--color-accent)',
        color: '#fff',
        borderRadius: '0.5rem',
        textDecoration: 'none',
      }}>
        Go Home
      </Link>
    </div>
  );
}
