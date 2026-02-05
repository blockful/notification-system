import Link from 'next/link';

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error === '1';

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-panel p-8 shadow-lg">
        <h1 className="text-2xl font-semibold">Dashboard Login</h1>
        <p className="mt-2 text-sm text-muted">
          Enter the dashboard password to continue.
        </p>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            Incorrect password. Please try again.
          </div>
        ) : null}

        <form className="mt-6 space-y-4" method="POST" action="/api/auth">
          <label className="block text-sm font-medium text-muted">
            Password
            <input
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-xs text-muted">
          Need access? Contact the engineering team.
        </p>

        <Link href="/" className="mt-4 inline-block text-xs text-muted underline">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
