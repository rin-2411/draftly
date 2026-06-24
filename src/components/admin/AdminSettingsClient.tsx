"use client";

import { useCallback, useEffect, useState } from "react";
import type { SystemSettings } from "@/lib/admin/settings";
import { Loader2, Save } from "lucide-react";

export function AdminSettingsClient() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    const data = (await res.json()) as { settings?: SystemSettings; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to load settings.");
      return;
    }
    setSettings(data.settings ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = (await res.json()) as { settings?: SystemSettings; error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed.");
      return;
    }
    setSettings(data.settings ?? settings);
    setMessage("Settings saved.");
  };

  if (!settings) {
    return <p className="text-sm text-zinc-500">{error ?? "Loading settings…"}</p>;
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-white">System settings</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Maintenance mode, announcements, and daily AI limits.
      </p>
      <div className="mt-8 space-y-5 rounded-2xl border border-white/[0.06] bg-[#141210] p-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.maintenance_mode}
            onChange={(e) =>
              setSettings({ ...settings, maintenance_mode: e.target.checked })
            }
            className="h-4 w-4 rounded border-white/20"
          />
          <span className="text-sm text-zinc-200">Maintenance mode (blocks AI generation)</span>
        </label>
        <div>
          <label className="text-xs font-medium text-zinc-400">Maintenance message</label>
          <textarea
            value={settings.maintenance_message}
            onChange={(e) =>
              setSettings({ ...settings, maintenance_message: e.target.value })
            }
            rows={2}
            className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c9a06c]/40"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400">
            Announcement (shown on home hub)
          </label>
          <textarea
            value={settings.announcement}
            onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
            rows={2}
            placeholder="Leave empty to hide"
            className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c9a06c]/40"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400">Daily generate limit per user</label>
          <input
            type="number"
            min={1}
            max={500}
            value={settings.daily_generate_limit}
            onChange={(e) =>
              setSettings({
                ...settings,
                daily_generate_limit: Number(e.target.value) || 50,
              })
            }
            className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c9a06c]/40"
          />
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[#c9a06c] px-4 py-2 text-sm font-semibold text-[#1a120e] disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save settings
        </button>
        {message && <p className="text-sm text-[#edd9c8]">{message}</p>}
        {error && <p className="text-sm text-red-300">{error}</p>}
      </div>
      <p className="mt-6 text-xs leading-relaxed text-zinc-500">
        Grant admin access by setting <code className="text-zinc-400">ADMIN_EMAILS</code> in{" "}
        <code className="text-zinc-400">.env</code> (comma-separated) or promoting a user above.
        Requires <code className="text-zinc-400">SUPABASE_SERVICE_ROLE_KEY</code> for admin APIs.
      </p>
    </div>
  );
}
