import Link from 'next/link';

export default function PrivacyPolicy() {
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
          }}>Privacy Policy</h1>
          <p style={{ color: '#6b7280' }}>Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div style={{ lineHeight: '1.6', color: '#374151' }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, register for leagues, or contact us for support.
            </p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '1rem', marginBottom: '0.5rem', color: '#111827' }}>
              Personal Information:
            </h3>
            <ul style={{ marginLeft: '2rem' }}>
              <li>Name and email address</li>
              <li>Phone number (for match notifications)</li>
              <li>Skill level and player preferences</li>
              <li>Match results and statistics</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              2. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul style={{ marginLeft: '2rem', marginTop: '1rem' }}>
              <li>Provide and maintain our service</li>
              <li>Process league registrations and manage leagues</li>
              <li>Send match reminders and notifications</li>
              <li>Display league standings and statistics</li>
              <li>Communicate with you about your account</li>
              <li>Improve our service and user experience</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              3. Information Sharing
            </h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties. However, we may share certain information in the following circumstances:
            </p>
            <ul style={{ marginLeft: '2rem', marginTop: '1rem' }}>
              <li><strong>With other players:</strong> Your name and contact information may be visible to other players in your leagues for match coordination</li>
              <li><strong>Public standings:</strong> Your name and match results appear in league standings visible to other league participants</li>
              <li><strong>Legal requirements:</strong> We may disclose information if required by law or in response to valid requests by public authorities</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              4. Data Security
            </h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              5. Email Communications
            </h2>
            <p>
              We may send you emails about:
            </p>
            <ul style={{ marginLeft: '2rem', marginTop: '1rem' }}>
              <li>Match reminders and league updates</li>
              <li>Important account or service notifications</li>
              <li>Password reset requests</li>
            </ul>
            <p style={{ marginTop: '1rem' }}>
              You can manage your email preferences in your account settings.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              6. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              7. Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul style={{ marginLeft: '2rem', marginTop: '1rem' }}>
              <li>Access and update your personal information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of non-essential communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              8. Children's Privacy
            </h2>
            <p>
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              9. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "last updated" date.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
              10. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through the website contact form or email us directly.
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