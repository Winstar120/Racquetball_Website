'use client';

import Image from 'next/image';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type LoginFormProps = {
  registered?: string | null;
};

export default function LoginForm({ registered }: LoginFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        if (result?.error === 'CredentialsSignin') {
          setError('Invalid email or password');
        } else {
          setError(result?.error || 'Invalid email or password');
        }
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12 sm:px-6">
      <div className="w-full max-w-md rounded-3xl bg-white px-6 py-8 shadow-2xl sm:px-8 sm:py-10">
        <div className="text-center">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Durango Racquetball Association logo"
              width={160}
              height={160}
              priority
              className="mx-auto mb-6 h-20 w-auto cursor-pointer sm:mb-8 sm:h-24"
            />
          </Link>
          <h1 className="font-serif text-3xl text-slate-900 sm:text-4xl">
            Welcome Back
          </h1>
          <p className="mt-2 text-base text-slate-600">Sign in to your account</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          {registered && (
            <div
              role="alert"
              className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
            >
              Registration successful. Please sign in.
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 transition focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 transition focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-slate-900 transition hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="text-center text-sm text-slate-600">
            <span>Don&apos;t have an account? </span>
            <Link
              href="/register"
              className="font-medium text-slate-900 transition hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
