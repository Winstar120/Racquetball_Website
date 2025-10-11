import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '48rem',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '3rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Link href="/">
            <img src="/logo.png" alt="DRA" style={{
              height: '80px',
              width: 'auto',
              margin: '0 auto 1rem',
              display: 'block',
              cursor: 'pointer'
            }} />
          </Link>
          <h1 style={{
            fontSize: '2.5rem',
            fontFamily: 'var(--font-playfair), Georgia, serif',
            color: '#111827',
            marginBottom: '0.5rem'
          }}>Terms of Service</h1>
          <p style={{ color: '#6b7280' }}>Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div style={{ lineHeight: '1.6', color: '#374151' }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using this racquetball league management system, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              2. Use License
            </h2>
            <p>
              Permission is granted to temporarily access this website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul style={{ marginLeft: '2rem', marginTop: '1rem' }}>
              <li>modify or copy the materials</li>
              <li>use the materials for any commercial purpose or for any public display</li>
              <li>attempt to reverse engineer any software contained on the website</li>
              <li>remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              3. User Accounts
            </h2>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              4. League Participation
            </h2>
            <p>
              By registering for leagues, you agree to:
            </p>
            <ul style={{ marginLeft: '2rem', marginTop: '1rem' }}>
              <li>Attend scheduled matches on time</li>
              <li>Report scores accurately and promptly</li>
              <li>Respect other players and follow good sportsmanship</li>
              <li>Pay any required league fees</li>
              <li>Follow facility rules and regulations</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              5. Disclaimer
            </h2>
            <p>
              The materials on this website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              6. Limitations
            </h2>
            <p>
              In no event shall the racquetball league or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this website.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              7. Revisions
            </h2>
            <p>
              We may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              8. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through the website contact form.
            </p>
          </section>
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link href="/" style={{
            color: '#111827',
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}