import Image from 'next/image';
import Link from 'next/link';

export default function TermsOfService() {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-800 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white px-6 py-10 shadow-lg sm:px-10 sm:py-12">
        <div className="text-center">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Durango Racquetball Association logo"
              width={128}
              height={128}
              priority
              className="mx-auto mb-6 h-16 w-auto cursor-pointer sm:mb-8 sm:h-20"
            />
          </Link>
          <h1 className="font-serif text-3xl text-slate-900 sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="mt-10 space-y-10 text-base leading-relaxed text-slate-700 sm:mt-12">
          <section>
            <h2 className="font-serif text-2xl text-slate-900">
              1. Acceptance of Terms
            </h2>
            <p className="mt-4">
              By accessing and using this racquetball league management system, you
              accept and agree to be bound by the terms and provision of this
              agreement.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">2. Use License</h2>
            <p className="mt-4">
              Permission is granted to temporarily access this website for personal,
              non-commercial transitory viewing only. This is the grant of a
              license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">3. User Accounts</h2>
            <p className="mt-4">
              When you create an account with us, you must provide information that
              is accurate, complete, and current at all times. You are responsible
              for safeguarding the password and for all activities that occur under
              your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">
              4. League Participation
            </h2>
            <p className="mt-4">By registering for leagues, you agree to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Attend scheduled matches on time</li>
              <li>Report scores accurately and promptly</li>
              <li>Respect other players and follow good sportsmanship</li>
              <li>Pay any required league fees</li>
              <li>Follow facility rules and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">5. Disclaimer</h2>
            <p className="mt-4">
              The materials on this website are provided on an &quot;as is&quot; basis. We
              make no warranties, expressed or implied, and hereby disclaim and
              negate all other warranties including, without limitation, implied
              warranties or conditions of merchantability, fitness for a particular
              purpose, or non-infringement of intellectual property or other
              violation of rights.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">6. Limitations</h2>
            <p className="mt-4">
              In no event shall the racquetball league or its suppliers be liable
              for any damages (including, without limitation, damages for loss of
              data or profit, or due to business interruption) arising out of the
              use or inability to use the materials on this website.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">7. Revisions</h2>
            <p className="mt-4">
              We may revise these terms of service at any time without notice. By
              using this website, you are agreeing to be bound by the then current
              version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">
              8. Contact Information
            </h2>
            <p className="mt-4">
              If you have any questions about these Terms of Service, please
              contact us through the website contact form.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center text-sm font-semibold text-slate-900 transition hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
