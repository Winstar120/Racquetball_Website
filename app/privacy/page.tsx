import Image from 'next/image';
import Link from 'next/link';

export default function PrivacyPolicy() {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-800 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white px-6 py-10 shadow-lg sm:px-10 sm:py-12">
        <div className="text-center">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Durango Racquetball Association logo"
              width={200}
              height={200}
              priority
              className="mx-auto mb-6 h-24 w-auto cursor-pointer sm:mb-8 sm:h-28"
            />
          </Link>
          <h1 className="font-serif text-3xl text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="mt-10 space-y-10 text-base leading-relaxed text-slate-700 sm:mt-12">
          <section>
            <h2 className="font-serif text-2xl text-slate-900">
              1. Information We Collect
            </h2>
            <p className="mt-4">
              We collect information you provide directly to us, such as when you
              create an account, register for leagues, or contact us for support.
            </p>
            <h3 className="mt-6 font-serif text-xl text-slate-900">
              Personal Information
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Name and email address</li>
              <li>Phone number (for match notifications)</li>
              <li>Skill level and player preferences</li>
              <li>Match results and statistics</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">
              2. How We Use Your Information
            </h2>
            <p className="mt-4">We use the information we collect to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Provide and maintain our service</li>
              <li>Process league registrations and manage leagues</li>
              <li>Send match reminders and notifications</li>
              <li>Display league standings and statistics</li>
              <li>Communicate with you about your account</li>
              <li>Improve our service and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">
              3. Information Sharing
            </h2>
            <p className="mt-4">
              We do not sell, trade, or otherwise transfer your personal
              information to third parties. However, we may share certain information
              in the following circumstances:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>With other players:</strong> Your name and contact
                information may be visible to other players in your leagues for
                match coordination.
              </li>
              <li>
                <strong>Public standings:</strong> Your name and match results
                appear in league standings visible to other league participants.
              </li>
              <li>
                <strong>Legal requirements:</strong> We may disclose information if
                required by law or in response to valid requests by public
                authorities.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">4. Data Security</h2>
            <p className="mt-4">
              We implement appropriate technical and organizational security
              measures to protect your personal information against unauthorized
              access, alteration, disclosure, or destruction. However, no method of
              transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">
              5. Email Communications
            </h2>
            <p className="mt-4">We may send you emails about:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Match reminders and league updates</li>
              <li>Important account or service notifications</li>
              <li>Password reset requests</li>
            </ul>
            <p className="mt-4">
              You can manage your email preferences in your account settings.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">
              6. Data Retention
            </h2>
            <p className="mt-4">
              We retain your personal information for as long as your account is
              active or as needed to provide you services. We will retain and use
              your information as necessary to comply with our legal obligations,
              resolve disputes, and enforce our agreements.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">7. Your Rights</h2>
            <p className="mt-4">You have the right to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Access and update your personal information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of non-essential communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">
              8. Children&apos;s Privacy
            </h2>
            <p className="mt-4">
              Our service is not intended for children under 13 years of age. We do
              not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">
              9. Changes to This Policy
            </h2>
            <p className="mt-4">
              We may update this privacy policy from time to time. We will notify
              you of any changes by posting the new privacy policy on this page and
              updating the last updated date.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900">
              10. Contact Us
            </h2>
            <p className="mt-4">
              If you have any questions about this Privacy Policy, please contact us
              through the website contact form or email us directly.
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
