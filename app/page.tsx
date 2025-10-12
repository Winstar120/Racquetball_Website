import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Hero Section with Full Height */}
      <section style={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #1f2937 100%)',
        overflow: 'hidden'
      }}>
        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '0 1rem',
          maxWidth: '64rem',
          margin: '0 auto'
        }}>
          <img
            src="/logo.png"
            alt="DRA Logo"
            style={{
              height: '250px',
              width: 'auto',
              margin: '0 auto 3rem',
              display: 'block'
            }}
          />

          <h1 style={{
            fontSize: 'clamp(2.5rem, 7vw, 5rem)',
            fontFamily: 'var(--font-playfair), Georgia, serif',
            marginBottom: '1.5rem',
            color: 'white',
            lineHeight: '1.1'
          }}>
            Durango Racquetball Association
          </h1>

          <p style={{
            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
            color: '#d1d5db',
            marginBottom: '3rem',
            fontWeight: '300'
          }}>
            Premier racquetball league in Durango, Colorado
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Link
              href="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '500',
                color: 'black',
                backgroundColor: 'white',
                border: '1px solid white',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              Join the League
            </Link>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: 'transparent',
                border: '1px solid white',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              Member Login
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section style={{
        padding: '6rem 1rem',
        backgroundColor: 'white'
      }}>
        <div style={{
          maxWidth: '72rem',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '3rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#1f2937',
              borderRadius: '50%',
              margin: '0 auto 1.5rem'
            }}></div>
            <h3 style={{
              fontSize: '1.5rem',
              fontFamily: 'var(--font-playfair), Georgia, serif',
              marginBottom: '1rem',
              color: '#111827'
            }}>Competitive Play</h3>
            <p style={{
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Join leagues matched to your skill level and compete in a friendly, challenging environment.
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#1f2937',
              borderRadius: '50%',
              margin: '0 auto 1.5rem'
            }}></div>
            <h3 style={{
              fontSize: '1.5rem',
              fontFamily: 'var(--font-playfair), Georgia, serif',
              marginBottom: '1rem',
              color: '#111827'
            }}>Weekly Matches</h3>
            <p style={{
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Regular match schedules keep you active and engaged throughout the season.
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#1f2937',
              borderRadius: '50%',
              margin: '0 auto 1.5rem'
            }}></div>
            <h3 style={{
              fontSize: '1.5rem',
              fontFamily: 'var(--font-playfair), Georgia, serif',
              marginBottom: '1rem',
              color: '#111827'
            }}>Community</h3>
            <p style={{
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Connect with fellow racquetball enthusiasts and build lasting friendships.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 1rem',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{
          maxWidth: '48rem',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontFamily: 'var(--font-playfair), Georgia, serif',
            marginBottom: '1.5rem',
            color: '#111827'
          }}>
            Ready to Play?
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#6b7280',
            marginBottom: '2rem'
          }}>
            Join the Durango Racquetball Association today
          </p>
          <Link
            href="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '500',
              color: 'white',
              backgroundColor: '#1f2937',
              border: '1px solid #1f2937',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 1rem',
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '72rem',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            © 2024 Durango Racquetball Association. All rights reserved.
          </p>
          <div style={{
            display: 'flex',
            gap: '1.5rem'
          }}>
            <Link href="/about" style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              textDecoration: 'none'
            }}>
              About
            </Link>
            <Link href="/contact" style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              textDecoration: 'none'
            }}>
              Contact
            </Link>
            <Link href="/privacy" style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              textDecoration: 'none'
            }}>
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
