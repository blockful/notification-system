'use client';

import { useEffect, useMemo, useState } from 'react';

type DaoOption = {
  daoId: string;
  subscriberCount: number;
  label: string;
};

type UserRow = {
  id: string;
  channel: string;
  channelUserId: string;
  createdAt: string;
  addressCount: number;
  addresses: Array<{ address: string; ens: string | null }>;
  daoCount: number;
  daoIds: string[];
  slackWorkspaceName: string | null;
  slackWorkspaceId: string | null;
};

type UsersTableProps = {
  daoOptions: DaoOption[];
  channelOptions: string[];
};

const PAGE_SIZE = 100;

export default function UsersTable({ daoOptions, channelOptions }: UsersTableProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = PAGE_SIZE;
  const [minAddresses, setMinAddresses] = useState('');
  const [maxAddresses, setMaxAddresses] = useState('');
  const [dao, setDao] = useState('');
  const [channel, setChannel] = useState('');
  const [address, setAddress] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ensAvailable, setEnsAvailable] = useState(true);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('sortDirection', sortDirection);
      if (minAddresses.trim()) params.set('minAddresses', minAddresses.trim());
      if (maxAddresses.trim()) params.set('maxAddresses', maxAddresses.trim());
      if (dao) params.set('dao', dao);
      if (channel) params.set('channel', channel);
      if (address.trim()) params.set('address', address.trim());

      try {
        const response = await fetch(`/api/metrics/users?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to load users');
        }
        const data = await response.json();
        if (!cancelled) {
          setUsers(data.users ?? []);
          setTotal(data.total ?? 0);
          setEnsAvailable(Boolean(data.ensAvailable));
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

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, sortDirection, minAddresses, maxAddresses, dao, channel, address]);

  return (
    <div className="rounded-xl border border-border bg-panel p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-muted">Sort by created</label>
          <select
            value={sortDirection}
            onChange={(event) => {
              setPage(1);
              setSortDirection(event.target.value as 'asc' | 'desc');
            }}
            className="mt-1 w-36 rounded-md border border-border bg-background px-2 py-1 text-sm text-text"
          >
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted">Min addresses</label>
          <input
            value={minAddresses}
            onChange={(event) => {
              setPage(1);
              setMinAddresses(event.target.value);
            }}
            type="number"
            min={0}
            className="mt-1 w-32 rounded-md border border-border bg-background px-2 py-1 text-sm text-text"
          />
        </div>
        <div>
          <label className="block text-xs text-muted">Max addresses</label>
          <input
            value={maxAddresses}
            onChange={(event) => {
              setPage(1);
              setMaxAddresses(event.target.value);
            }}
            type="number"
            min={0}
            className="mt-1 w-32 rounded-md border border-border bg-background px-2 py-1 text-sm text-text"
          />
        </div>
        <div>
          <label className="block text-xs text-muted">DAO</label>
          <select
            value={dao}
            onChange={(event) => {
              setPage(1);
              setDao(event.target.value);
            }}
            className="mt-1 w-48 rounded-md border border-border bg-background px-2 py-1 text-sm text-text"
          >
            <option value="">All DAOs</option>
            {daoOptions.map((option) => (
              <option key={option.daoId} value={option.daoId}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted">Channel</label>
          <select
            value={channel}
            onChange={(event) => {
              setPage(1);
              setChannel(event.target.value);
            }}
            className="mt-1 w-36 rounded-md border border-border bg-background px-2 py-1 text-sm text-text"
          >
            <option value="">All channels</option>
            {channelOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted">Address or ENS</label>
          <input
            value={address}
            onChange={(event) => {
              setPage(1);
              setAddress(event.target.value);
            }}
            placeholder="0x... or name.eth"
            className="mt-1 w-48 rounded-md border border-border bg-background px-2 py-1 text-sm text-text"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-300">{error}</p>
      ) : null}
      {!ensAvailable ? (
        <p className="mt-4 text-xs text-amber-200">ENS lookups unavailable.</p>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th className="py-2">Channel</th>
              <th className="py-2">User ID</th>
              <th className="py-2">Created</th>
              <th className="py-2">Addresses</th>
              <th className="py-2">DAOs</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="py-4 text-muted" colSpan={5}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="py-4 text-muted" colSpan={5}>
                  No users found for the current filters.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="py-3">
                    <div className="text-sm">{user.channel}</div>
                    {user.channel === 'slack' ? (
                      <div className="text-xs text-muted">
                        Workspace: {user.slackWorkspaceName ?? user.slackWorkspaceId ?? '—'}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3 text-xs text-muted">
                    {user.channel === 'slack' && user.channelUserId.includes(':')
                      ? user.channelUserId.split(':')[1]
                      : user.channelUserId}
                  </td>
                  <td className="py-3 text-xs text-muted">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <p className="text-xs text-muted">{user.addressCount} tracked</p>
                    <div className="mt-1 text-xs text-muted">
                      {user.addresses.length === 0
                        ? '—'
                        : user.addresses.map((item) => (
                            <div key={item.address}>
                              {item.ens ? `${item.ens} (${item.address})` : item.address}
                            </div>
                          ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <p className="text-xs text-muted">{user.daoCount} DAOs</p>
                    <p className="mt-1 text-xs">{user.daoIds.join(', ') || '—'}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>
          Page {page} of {totalPages} • {total} users • {pageSize} per page
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="rounded-md border border-border px-2 py-1 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-border px-2 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
