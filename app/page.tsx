import Image from 'next/image'
import Link from 'next/link'

const features = [
  {
    title: 'Competitive Play',
    description:
      'Join leagues matched to your skill level and compete in a friendly, challenging environment.',
  },
  {
    title: 'Weekly Matches',
    description:
      'Regular match schedules keep you active and engaged throughout the season.',
  },
  {
    title: 'Community',
    description:
      'Connect with fellow racquetball enthusiasts and build lasting friendships.',
  },
]

export default function Home() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="app-gradient-bg min-h-screen text-white">
      <main className="flex min-h-screen flex-col">
        <section className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />

          <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-24 text-center sm:px-8 md:py-28 lg:px-10">
            <Image
              src="/logo.png"
              alt="Durango Racquetball Association"
              width={256}
              height={256}
              priority
              className="mb-10 h-32 w-auto max-w-[16rem] sm:mb-12 sm:h-40"
            />

            <div className="flex flex-col items-center gap-6 sm:gap-8">
              <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl sm:leading-tight lg:text-6xl">
                Durango Racquetball Association
              </h1>

              <p className="max-w-2xl text-lg leading-relaxed text-slate-200 sm:text-xl">
                Premier racquetball league in Durango, Colorado
              </p>

              <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
                >
                  Join the League
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
                >
                  Member Login
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 sm:px-8 md:grid-cols-3">
            {features.map(({ title, description }) => (
              <article
                key={title}
                className="flex h-full flex-col items-center rounded-3xl bg-white/95 px-6 py-8 text-center text-slate-900 shadow-2xl sm:px-8 sm:py-10"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white shadow-md sm:h-20 sm:w-20" />
                <h3 className="font-serif text-2xl">{title}</h3>
                <p className="mt-3 max-w-sm text-base leading-relaxed text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center sm:px-8">
            <div className="w-full rounded-3xl bg-white/95 px-6 py-10 text-slate-900 shadow-2xl sm:px-10 sm:py-12">
              <h2 className="font-serif text-3xl font-semibold text-slate-900 sm:text-4xl">
                Ready to Play?
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600 sm:text-xl">
                Join the Durango Racquetball Association today
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-white/5 py-12">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 text-center text-white/80 sm:flex-row sm:justify-between sm:px-8 sm:text-left">
            <p className="text-sm">
              © {currentYear} Durango Racquetball Association. All rights
              reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm sm:justify-end">
              <Link
                href="/about"
                className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Contact
              </Link>
              <Link
                href="/privacy"
                className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Privacy
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
