/**
 * Dashboard Metrics Module
 *
 * This module provides read-only access to database metrics.
 * All queries are validated to ensure only SELECT operations are executed.
 * The dashboard never writes to the database.
 */
import { query } from './db';

export type GrowthPoint = {
  date: string;
  count: number;
  cumulative: number;
};

export type DaoItem = {
  daoId: string;
  subscriberCount: number;
};

export type DaoNotificationItem = {
  daoId: string;
  notificationCount: number;
};

export type SummaryMetrics = {
  totals: {
    users: number;
    activeSubscriptions: number;
    activeAddresses: number;
    notifications: number;
  };
  channelDistribution: Array<{ channel: string; count: number }>;
  engagementDistribution: Array<{ addressCount: number; userCount: number }>;
  notificationActivity: Array<{ date: string; count: number }>;
};

export type NotificationActivityPoint = {
  date: string;
  count: number;
};

export type TopFollowedAddress = {
  address: string;
  followerCount: number;
};

export type UsersByDaoCount = {
  daoCount: number;
  userCount: number;
};

export type UserMetricsRow = {
  id: string;
  channel: string;
  channelUserId: string;
  createdAt: string;
  addressCount: number;
  addresses: string[];
  daoCount: number;
  daoIds: string[];
  slackWorkspaceName: string | null;
  slackWorkspaceId: string | null;
};

export type UsersFilter = {
  minAddresses?: number;
  maxAddresses?: number;
  dao?: string;
  channel?: string;
  address?: string;
};

export type UsersQueryResult = {
  users: UserMetricsRow[];
  total: number;
};

export type UsersSortDirection = 'asc' | 'desc';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

function createTimedCache<T>(ttlMs: number) {
  let entry: CacheEntry<T> | null = null;
  return {
    get() {
      if (!entry) return null;
      if (entry.expiresAt < Date.now()) {
        entry = null;
        return null;
      }
      return entry.value;
    },
    set(value: T) {
      entry = { value, expiresAt: Date.now() + ttlMs };
    },
  };
}

const summaryCache = createTimedCache<SummaryMetrics>(30_000);
const growthCache = createTimedCache<GrowthPoint[]>(30_000);
const daoCache = createTimedCache<DaoItem[]>(30_000);
const daoNotificationCache = createTimedCache<DaoNotificationItem[]>(30_000);
const notificationActivityCache = createTimedCache<NotificationActivityPoint[]>(30_000);
const topFollowedAddressesCache = createTimedCache<TopFollowedAddress[]>(30_000);
const usersByDaoCountCache = createTimedCache<UsersByDaoCount[]>(30_000);

export function buildEngagementDistributionQuery() {
  return `
      SELECT COALESCE(addr.address_count, 0) as address_count, COUNT(*) as user_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) FILTER (WHERE is_active) as address_count
        FROM user_addresses
        GROUP BY user_id
      ) addr ON addr.user_id = u.id
      GROUP BY COALESCE(addr.address_count, 0)
      ORDER BY COALESCE(addr.address_count, 0)
    `;
}

export async function getSummaryMetrics(): Promise<SummaryMetrics> {
  const cached = summaryCache.get();
  if (cached) return cached;

  const [usersCount] = await query<{ count: string }>('SELECT COUNT(*) as count FROM users');
  const [subsCount] = await query<{ count: string }>(
    "SELECT COUNT(*) as count FROM user_preferences WHERE is_active = true"
  );
  const [addressesCount] = await query<{ count: string }>(
    "SELECT COUNT(*) as count FROM user_addresses WHERE is_active = true"
  );
  const [notificationsCount] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM notifications'
  );

  const channels = await query<{ channel: string; count: string }>(
    'SELECT channel, COUNT(*) as count FROM users GROUP BY channel ORDER BY count DESC'
  );

  const engagement = await query<{ address_count: number; user_count: string }>(
    buildEngagementDistributionQuery()
  );

  const notificationActivity = await getNotificationActivityByDay();

  const result = {
    totals: {
      users: Number(usersCount?.count ?? 0),
      activeSubscriptions: Number(subsCount?.count ?? 0),
      activeAddresses: Number(addressesCount?.count ?? 0),
      notifications: Number(notificationsCount?.count ?? 0),
    },
    channelDistribution: channels.map((row) => ({
      channel: row.channel,
      count: Number(row.count),
    })),
    engagementDistribution: engagement.map((row) => ({
      addressCount: Number(row.address_count),
      userCount: Number(row.user_count),
    })),
    notificationActivity,
  };
  summaryCache.set(result);
  return result;
}

export async function getGrowthMetrics(): Promise<GrowthPoint[]> {
  const cached = growthCache.get();
  if (cached) return cached;

  const rows = await query<{ day: string; count: string }>(
    `
      SELECT date_trunc('day', created_at::timestamptz) as day, COUNT(*) as count
      FROM users
      GROUP BY day
      ORDER BY day
    `
  );

  const result = buildGrowthSeries(rows);
  growthCache.set(result);
  return result;
}

export function buildGrowthSeries(rows: Array<{ day: string; count: string }>): GrowthPoint[] {
  if (!rows.length) return [];

  const dailyCounts = new Map<string, number>();
  rows.forEach((row) => {
    const date = new Date(row.day).toISOString().slice(0, 10);
    dailyCounts.set(date, Number(row.count));
  });

  const startDate = new Date(rows[0].day);
  const endDate = new Date(rows[rows.length - 1].day);
  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(0, 0, 0, 0);

  let cumulative = 0;
  const result: GrowthPoint[] = [];

  for (const cursor = new Date(startDate); cursor <= endDate; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    const count = dailyCounts.get(date) ?? 0;
    cumulative += count;
    result.push({ date, count, cumulative });
  }

  return result;
}

export async function getTopDaos(limit = 10): Promise<DaoItem[]> {
  const cached = daoCache.get();
  if (cached && limit === 10) return cached;

  const rows = await query<{ dao_id: string; subscriber_count: string }>(
    `
      SELECT TRIM(dao_id) as dao_id, COUNT(*) as subscriber_count
      FROM user_preferences
      WHERE is_active = true
        AND dao_id IS NOT NULL
        AND TRIM(dao_id) <> ''
      GROUP BY TRIM(dao_id)
      ORDER BY subscriber_count DESC
      LIMIT $1
    `,
    [limit]
  );

  const result = rows.map((row) => ({
    daoId: row.dao_id,
    subscriberCount: Number(row.subscriber_count),
  }));
  if (limit === 10) daoCache.set(result);
  return result;
}

export async function getNotificationActivityByDao(
  limit = 10
): Promise<DaoNotificationItem[]> {
  const cached = daoNotificationCache.get();
  if (cached && limit === 10) return cached;

  const { text, values } = buildNotificationActivityByDaoQuery(limit);
  const rows = await query<{ dao_id: string; notification_count: string }>(text, values);

  const result = rows.map((row) => ({
    daoId: row.dao_id,
    notificationCount: Number(row.notification_count),
  }));
  if (limit === 10) daoNotificationCache.set(result);
  return result;
}

export function buildNotificationActivityByDayQuery(daoId?: string) {
  if (daoId) {
    return {
      text: `
        SELECT date_trunc('day', created_at) as day, COUNT(*) as count
        FROM notifications
        WHERE dao_id = $1
        GROUP BY day
        ORDER BY day
      `,
      values: [daoId],
    };
  }

  return {
    text: `
      SELECT date_trunc('day', created_at) as day, COUNT(*) as count
      FROM notifications
      GROUP BY day
      ORDER BY day
    `,
    values: [],
  };
}

export async function getNotificationActivityByDay(
  daoId?: string
): Promise<NotificationActivityPoint[]> {
  if (!daoId) {
    const cached = notificationActivityCache.get();
    if (cached) return cached;
  }

  const { text, values } = buildNotificationActivityByDayQuery(daoId);
  const rows = await query<{ day: string; count: string }>(text, values);
  const result = rows.map((row) => ({
    date: new Date(row.day).toISOString().slice(0, 10),
    count: Number(row.count),
  }));

  if (!daoId) notificationActivityCache.set(result);
  return result;
}

export function buildNotificationActivityByDaoQuery(limit: number) {
  return {
    text: `
      SELECT TRIM(dao_id) as dao_id, COUNT(DISTINCT event_id) as notification_count
      FROM notifications
      WHERE dao_id IS NOT NULL
        AND TRIM(dao_id) <> ''
      GROUP BY TRIM(dao_id)
      ORDER BY notification_count DESC
      LIMIT $1
    `,
    values: [limit],
  };
}

export function buildTopFollowedAddressesQuery(limit: number) {
  return {
    text: `
      SELECT LOWER(ua.address) as address, COUNT(DISTINCT ua.user_id) as follower_count
      FROM user_addresses ua
      WHERE ua.is_active = true
      GROUP BY LOWER(ua.address)
      ORDER BY follower_count DESC
      LIMIT $1
    `,
    values: [limit],
  };
}

export async function getTopFollowedAddresses(limit = 10): Promise<TopFollowedAddress[]> {
  const cached = topFollowedAddressesCache.get();
  if (cached && limit === 10) return cached;

  const { text, values } = buildTopFollowedAddressesQuery(limit);
  const rows = await query<{ address: string; follower_count: string }>(text, values);

  const result = rows.map((row) => ({
    address: row.address,
    followerCount: Number(row.follower_count),
  }));
  if (limit === 10) topFollowedAddressesCache.set(result);
  return result;
}

export function buildUsersByDaoCountQuery() {
  return `
    SELECT dao_count, COUNT(*) as user_count
    FROM (
      SELECT u.id, COUNT(p.id) as dao_count
      FROM users u
      LEFT JOIN user_preferences p ON p.user_id = u.id AND p.is_active = true
      GROUP BY u.id
    ) user_dao_counts
    GROUP BY dao_count
    ORDER BY dao_count
  `;
}

export async function getUsersByDaoCount(): Promise<UsersByDaoCount[]> {
  const cached = usersByDaoCountCache.get();
  if (cached) return cached;

  const text = buildUsersByDaoCountQuery();
  const rows = await query<{ dao_count: number; user_count: string }>(text);

  const result = rows.map((row) => ({
    daoCount: Number(row.dao_count),
    userCount: Number(row.user_count),
  }));
  usersByDaoCountCache.set(result);
  return result;
}

export function buildUsersQueries(
  filters: UsersFilter,
  page: number,
  pageSize: number,
  sortDirection: UsersSortDirection
) {
  const clauses: string[] = [];
  const values: Array<string | number> = [];

  if (filters.dao) {
    if (filters.dao === '__unknown__') {
      clauses.push(
        `EXISTS (SELECT 1 FROM user_preferences p WHERE p.user_id = u.id AND p.is_active = true AND (p.dao_id = '' OR p.dao_id IS NULL))`
      );
    } else {
      values.push(filters.dao);
      clauses.push(
        `EXISTS (SELECT 1 FROM user_preferences p WHERE p.user_id = u.id AND p.is_active = true AND p.dao_id = $${
          values.length
        })`
      );
    }
  }

  if (filters.channel) {
    values.push(filters.channel);
    clauses.push(`u.channel = $${values.length}`);
  }

  if (filters.address) {
    values.push(filters.address);
    clauses.push(
      `EXISTS (SELECT 1 FROM user_addresses ua WHERE ua.user_id = u.id AND ua.is_active = true AND LOWER(ua.address) = LOWER($${values.length}))`
    );
  }

  if (filters.minAddresses !== undefined) {
    values.push(filters.minAddresses);
    clauses.push(`COALESCE(addr.address_count, 0) >= $${values.length}`);
  }

  if (filters.maxAddresses !== undefined) {
    values.push(filters.maxAddresses);
    clauses.push(`COALESCE(addr.address_count, 0) <= $${values.length}`);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const baseQuery = `
    FROM users u
    LEFT JOIN channel_workspaces cw
      ON u.channel = 'slack'
      AND split_part(u.channel_user_id, ':', 1) = cw.workspace_id
      AND cw.channel = 'slack'
    LEFT JOIN (
      SELECT user_id, COUNT(*) FILTER (WHERE is_active) as address_count,
             ARRAY_AGG(address) FILTER (WHERE is_active) as addresses
      FROM user_addresses
      GROUP BY user_id
    ) addr ON addr.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) FILTER (WHERE is_active) as dao_count,
             ARRAY_AGG(dao_id) FILTER (WHERE is_active) as dao_ids
      FROM user_preferences
      GROUP BY user_id
    ) pref ON pref.user_id = u.id
    ${whereClause}
  `;

  const countQuery = {
    text: `SELECT COUNT(*) as count ${baseQuery}`,
    values: [...values],
  };

  values.push(pageSize);
  values.push((page - 1) * pageSize);
  const listQuery = {
    text: `
      SELECT
        u.id,
        u.channel,
        u.channel_user_id,
        u.created_at,
        COALESCE(addr.address_count, 0) as address_count,
        COALESCE(addr.addresses, ARRAY[]::text[]) as addresses,
        COALESCE(pref.dao_count, 0) as dao_count,
        COALESCE(pref.dao_ids, ARRAY[]::text[]) as dao_ids,
        CASE
          WHEN u.channel = 'slack' THEN split_part(u.channel_user_id, ':', 1)
          ELSE NULL
        END as slack_workspace_id,
        cw.workspace_name as slack_workspace_name
      ${baseQuery}
      ORDER BY u.created_at ${sortDirection}
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
    `,
    values,
  };

  return { countQuery, listQuery };
}

export async function getUsersMetrics(
  filters: UsersFilter,
  page: number,
  pageSize: number,
  sortDirection: UsersSortDirection
): Promise<UsersQueryResult> {
  const { countQuery, listQuery } = buildUsersQueries(filters, page, pageSize, sortDirection);
  const [countRow] = await query<{ count: string }>(countQuery.text, countQuery.values);
  const rows = await query<{
    id: string;
    channel: string;
    channel_user_id: string;
    created_at: string;
    address_count: string;
    addresses: string[] | null;
    dao_count: string;
    dao_ids: string[] | null;
    slack_workspace_name: string | null;
    slack_workspace_id: string | null;
  }>(listQuery.text, listQuery.values);

  return {
    total: Number(countRow?.count ?? 0),
    users: rows.map((row) => ({
      id: row.id,
      channel: row.channel,
      channelUserId: row.channel_user_id,
      createdAt: row.created_at,
      addressCount: Number(row.address_count ?? 0),
      addresses: row.addresses ?? [],
      daoCount: Number(row.dao_count ?? 0),
      daoIds: row.dao_ids ?? [],
      slackWorkspaceName: row.slack_workspace_name ?? null,
      slackWorkspaceId: row.slack_workspace_id ?? null,
    })),
  };
}
