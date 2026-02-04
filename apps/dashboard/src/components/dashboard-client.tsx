'use client';

import { useEffect, useState } from 'react';

import MetricCard from './metric-card';
import BarChartCard from './charts/bar-chart-card';
import LineChartCard from './charts/line-chart-card';
import PieChartCard from './charts/pie-chart-card';
import UsersTable from './tables/users-table';

type SummaryTotals = {
  users: number;
  activeSubscriptions: number;
  activeAddresses: number;
  notifications: number;
};

type ChannelDistribution = {
  channel: string;
  count: number;
};

type EngagementBucket = {
  addressCount: number;
  userCount: number;
};

type NotificationPoint = {
  date: string;
  count: number;
};

type SummaryResponse = {
  totals: SummaryTotals;
  channelDistribution: ChannelDistribution[];
  engagementDistribution: EngagementBucket[];
  notificationActivity: NotificationPoint[];
};

type GrowthPoint = {
  date: string;
  count: number;
  cumulative: number;
};

type GrowthResponse = {
  points: GrowthPoint[];
};

type DaoItem = {
  daoId: string;
  subscriberCount: number;
};

type DaoResponse = {
  items: DaoItem[];
};

type DaoNotificationItem = {
  daoId: string;
  notificationCount: number;
};

type DaoNotificationResponse = {
  items: DaoNotificationItem[];
};

type NotificationActivityResponse = {
  points: NotificationPoint[];
};

export default function DashboardClient() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [daos, setDaos] = useState<DaoItem[]>([]);
  const [daoNotifications, setDaoNotifications] = useState<DaoNotificationItem[]>([]);
  const [notificationActivity, setNotificationActivity] = useState<NotificationPoint[]>([]);
  const [notificationDaoFilter, setNotificationDaoFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, growthRes, daosRes, notificationsRes, activityRes] = await Promise.all([
          fetch('/api/metrics/summary'),
          fetch('/api/metrics/growth'),
          fetch('/api/metrics/daos'),
          fetch('/api/metrics/notifications-by-dao'),
          fetch('/api/metrics/notification-activity'),
        ]);

        if (
          !summaryRes.ok ||
          !growthRes.ok ||
          !daosRes.ok ||
          !notificationsRes.ok ||
          !activityRes.ok
        ) {
          throw new Error('Failed to load dashboard metrics.');
        }

        const summaryJson = (await summaryRes.json()) as SummaryResponse;
        const growthJson = (await growthRes.json()) as GrowthResponse;
        const daosJson = (await daosRes.json()) as DaoResponse;
        const notificationsJson = (await notificationsRes.json()) as DaoNotificationResponse;
        const activityJson = (await activityRes.json()) as NotificationActivityResponse;

        if (!cancelled) {
          setSummary(summaryJson);
          setGrowth(growthJson.points ?? []);
          setDaos(daosJson.items ?? []);
          setDaoNotifications(notificationsJson.items ?? []);
          setNotificationActivity(activityJson.points ?? summaryJson.notificationActivity ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadNotificationActivity() {
      const params = new URLSearchParams();
      if (notificationDaoFilter) params.set('dao', notificationDaoFilter);

      try {
        const response = await fetch(`/api/metrics/notification-activity?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to load notification activity.');
        }
        const data = (await response.json()) as NotificationActivityResponse;
        if (!cancelled) {
          setNotificationActivity(data.points ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    }

    loadNotificationActivity();
    return () => {
      cancelled = true;
    };
  }, [notificationDaoFilter]);

  if (loading && !summary) {
    return <p className="text-sm text-muted">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-300">{error}</p>;
  }

  if (!summary) {
    return <p className="text-sm text-muted">No data available.</p>;
  }

  const engagementChart = summary.engagementDistribution.map((item) => ({
    ...item,
    label: String(item.addressCount),
  }));
  const daoChart = daos.map((item) => ({
    ...item,
    label: item.daoId === '__unknown__' ? 'Unknown' : item.daoId,
  }));
  const daoOptions = daoChart.map((item) => ({
    daoId: item.daoId,
    subscriberCount: item.subscriberCount,
    label: item.label,
  }));

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total users" value={summary.totals.users} />
        <MetricCard label="Active subscriptions" value={summary.totals.activeSubscriptions} />
        <MetricCard label="Tracked addresses" value={summary.totals.activeAddresses} />
        <MetricCard label="Notifications sent" value={summary.totals.notifications} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <LineChartCard
          title="User base growth"
          data={growth}
          xKey="date"
          lineKey="cumulative"
          valueLabel="Users"
        />
        <div className="rounded-xl border border-border bg-panel p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-text">Notification activity</h3>
            <select
              value={notificationDaoFilter}
              onChange={(event) => setNotificationDaoFilter(event.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-text"
            >
              <option value="">All DAOs</option>
              {daoChart.map((item) => (
                <option key={item.daoId} value={item.daoId}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <LineChartCard
              title=""
              data={notificationActivity}
              xKey="date"
              lineKey="count"
              valueLabel="Notifications"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <PieChartCard
          title="Channel distribution"
          data={summary.channelDistribution}
          nameKey="channel"
          valueKey="count"
        />
        <BarChartCard
          title="Top DAOs by subscribers"
          data={daoChart}
          xKey="label"
          barKey="subscriberCount"
          valueLabel="Subscribers"
          forceAllTicks
        />
        <BarChartCard
          title="Notifications per DAO"
          data={daoNotifications.map((item) => ({ ...item, label: item.daoId }))}
          xKey="label"
          barKey="notificationCount"
          valueLabel="Notifications"
          forceAllTicks
        />
        <BarChartCard
          title="Addresses per user"
          data={engagementChart}
          xKey="label"
          barKey="userCount"
          valueLabel="Users"
        />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">User details</h2>
          <p className="text-sm text-muted">
            Filter by tracked addresses or DAO subscriptions.
          </p>
        </div>
        <UsersTable
          daoOptions={daoOptions}
          channelOptions={summary.channelDistribution.map((item) => item.channel)}
        />
      </section>
    </div>
  );
}
