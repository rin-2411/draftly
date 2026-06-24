"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminUserRow } from "@/lib/admin/users";

export function AdminUsersClient() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/users");
    const data = (await res.json()) as { users?: AdminUserRow[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to load users.");
      setLoading(false);
      return;
    }
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchUser = async (id: string, body: { role?: "user" | "admin"; is_disabled?: boolean }) => {
    setBusyId(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Update failed.");
      return;
    }
    await load();
  };

  if (loading) return <p className="text-sm text-zinc-500">Loading users…</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Users</h1>
      <p className="mt-1 text-sm text-zinc-500">Manage roles and account access.</p>
      {error && (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#141210]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Drafts</th>
              <th className="px-4 py-3 font-medium">Research</th>
              <th className="px-4 py-3 font-medium">AI today</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/[0.04] text-zinc-300">
                <td className="px-4 py-3">{u.email ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3 tabular-nums">{u.draft_count}</td>
                <td className="px-4 py-3 tabular-nums">{u.research_count}</td>
                <td className="px-4 py-3 tabular-nums">{u.generations_today}</td>
                <td className="px-4 py-3">
                  {u.is_disabled ? (
                    <span className="text-red-300">Disabled</span>
                  ) : (
                    <span className="text-emerald-400/90">Active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() =>
                        void patchUser(u.id, {
                          role: u.role === "admin" ? "user" : "admin",
                        })
                      }
                      className="rounded-full border border-white/[0.1] px-2.5 py-1 text-xs hover:bg-white/[0.06] disabled:opacity-50"
                    >
                      {u.role === "admin" ? "Demote" : "Make admin"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() =>
                        void patchUser(u.id, { is_disabled: !u.is_disabled })
                      }
                      className="rounded-full border border-white/[0.1] px-2.5 py-1 text-xs hover:bg-white/[0.06] disabled:opacity-50"
                    >
                      {u.is_disabled ? "Enable" : "Disable"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">No users found.</p>
        )}
      </div>
    </div>
  );
}
