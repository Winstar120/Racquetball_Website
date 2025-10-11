import React from 'react';

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export default function AdminPageLayout({ title, subtitle, children, headerAction }: AdminPageLayoutProps) {
  return (
    <div style={{
      maxWidth: '80rem',
      margin: '0 auto',
      padding: '2rem 1rem'
    }}>
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'white',
            fontFamily: 'var(--font-playfair), Georgia, serif'
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              marginTop: '0.5rem',
              color: '#d1d5db',
              fontSize: '0.875rem'
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {headerAction && (
          <div>
            {headerAction}
          </div>
        )}
      </div>

      <div>
        {children}
      </div>
    </div>
  );
}