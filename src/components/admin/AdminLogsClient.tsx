"use client";

import { useEffect, useState } from "react";
import type { GenerationLogRow } from "@/lib/admin/logs";

export function AdminLogsClient() {
  const [logs, setLogs] = useState<GenerationLogRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/logs");
      const data = (await res.json()) as { logs?: GenerationLogRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load logs.");
        return;
      }
      setLogs(data.logs ?? []);
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">AI generation logs</h1>
      <p className="mt-1 text-sm text-zinc-500">Recent research / generate runs across all users.</p>
      {error && (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#141210]">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Crawl</th>
              <th className="px-4 py-3">Language</th>
              <th className="px-4 py-3">URLs</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/[0.04] text-zinc-300">
                <td className="px-4 py-3 whitespace-nowrap text-xs">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs">{log.user_email ?? log.user_id.slice(0, 8)}</td>
                <td className="px-4 py-3">
                  {log.success ? (
                    <span className="text-emerald-400/90">OK</span>
                  ) : (
                    <span className="text-red-300" title={log.error_message ?? undefined}>
                      Failed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-xs">
                  {log.crawl_ok_count} ok / {log.crawl_fail_count} fail
                </td>
                <td className="px-4 py-3 text-xs">{log.language ?? "—"}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-xs text-zinc-500">
                  {log.source_urls[0] ?? "—"}
                  {log.source_urls.length > 1 ? ` +${log.source_urls.length - 1}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && !error && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">No logs yet.</p>
        )}
      </div>
    </div>
  );
}
