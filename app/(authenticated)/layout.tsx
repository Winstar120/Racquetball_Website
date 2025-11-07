import { Navigation } from '@/components/navigation'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="app-gradient-bg min-h-screen">
      <Navigation />
      <main className="py-8 md:py-10">
        {children}
      </main>
    </div>
  )
}
