'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const registered = searchParams.get('registered');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        // NextAuth returns "CredentialsSignin" as the error code for failed logins
        // Convert this to a more user-friendly message
        if (result?.error === 'CredentialsSignin') {
          setError('Invalid email or password');
        } else {
          setError(result?.error || 'Invalid email or password');
        }
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #1f2937 100%)',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '28rem',
        backgroundColor: 'white',
        padding: '3rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/">
            <img src="/logo.png" alt="DRA" style={{
              height: '100px',
              width: 'auto',
              margin: '0 auto 1.5rem',
              display: 'block',
              cursor: 'pointer'
            }} />
          </Link>
          <h1 style={{
            fontSize: '2rem',
            fontFamily: 'var(--font-playfair), Georgia, serif',
            color: '#111827',
            marginBottom: '0.5rem'
          }}>Welcome Back</h1>
          <p style={{
            color: '#6b7280',
            fontSize: '1rem'
          }}>Sign in to your account</p>
        </div>

        <form onSubmit={onSubmit}>
          {registered && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bfdbfe',
              fontSize: '0.875rem',
              color: '#1e40af'
            }}>
              Registration successful. Please sign in.
            </div>
          )}

          {error && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              fontSize: '0.875rem',
              color: '#991b1b'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  color: '#111827',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#111827';
                  e.target.style.boxShadow = '0 0 0 1px #111827';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  color: '#111827',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#111827';
                  e.target.style.boxShadow = '0 0 0 1px #111827';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: isLoading ? '#6b7280' : '#1f2937',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#111827';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                }
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div style={{
            marginTop: '1rem',
            textAlign: 'center',
            fontSize: '0.875rem'
          }}>
            <Link href="/forgot-password" style={{
              color: '#111827',
              fontWeight: '500',
              textDecoration: 'none'
            }}>
              Forgot your password?
            </Link>
          </div>

          <div style={{
            marginTop: '1rem',
            textAlign: 'center',
            fontSize: '0.875rem'
          }}>
            <span style={{ color: '#6b7280' }}>Don't have an account? </span>
            <Link href="/register" style={{
              color: '#111827',
              fontWeight: '500',
              textDecoration: 'none'
            }}>
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}