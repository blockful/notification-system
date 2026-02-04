import DashboardClient from '../components/dashboard-client';

export default function DashboardPage() {
  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header>
          <h1 className="text-3xl font-semibold">Subscription Metrics</h1>
          <p className="mt-2 text-sm text-muted">
            Real-time insights from the subscription-server database.
          </p>
        </header>

        <DashboardClient />
      </div>
    </main>
  );
}
