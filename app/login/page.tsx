import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = await searchParams;
  const registeredParam = resolvedParams?.registered;
  const registered = Array.isArray(registeredParam)
    ? registeredParam[0] ?? null
    : registeredParam ?? null;

  return (
    <div className="app-gradient-bg flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <LoginForm registered={registered} />
    </div>
  );
}
