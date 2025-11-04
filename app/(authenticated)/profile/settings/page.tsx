'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1.5rem 1rem'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827',
            fontFamily: 'var(--font-playfair), Georgia, serif'
          }}>Settings</h1>
          <p style={{
            marginTop: '0.25rem',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>Manage your account preferences</p>
        </div>
      </div>

      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '500',
            color: '#111827',
            marginBottom: '1rem',
            fontFamily: 'var(--font-playfair), Georgia, serif'
          }}>Notification Preferences</h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={emailUpdates}
                onChange={(e) => setEmailUpdates(e.target.checked)}
                id="emailUpdates"
                style={{
                  width: '1rem',
                  height: '1rem',
                  marginRight: '0.5rem',
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="emailUpdates" style={{
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer'
              }}>
                Receive email notifications for upcoming matches
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                id="notifications"
                style={{
                  width: '1rem',
                  height: '1rem',
                  marginRight: '0.5rem',
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="notifications" style={{
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer'
              }}>
                Receive email updates about league news and announcements
              </label>
            </div>
          </div>

          <button
            style={{
              marginTop: '1.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'white',
              backgroundColor: '#1f2937',
              border: '1px solid #1f2937',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#111827';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#1f2937';
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
