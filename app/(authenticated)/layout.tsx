import { Navigation } from '@/components/navigation'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1f2937 0%, #4b5563 50%, #1f2937 100%)',
      backgroundAttachment: 'fixed',
      backgroundColor: '#1f2937'
    }}>
      <Navigation />
      <main style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {children}
      </main>
    </div>
  )
}