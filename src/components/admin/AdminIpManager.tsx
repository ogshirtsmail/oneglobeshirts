"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type StoredIp = { ip: string; label: string; addedAt: string };
type Snapshot = { yourIp: string | null; envIps: string[]; storedIps: StoredIp[]; configured: boolean };

export default function AdminIpManager() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [ip, setIp] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/ips", { cache: "no-store" });
    if (res.ok) setData(await res.json());
    else setMessage({ kind: "error", text: "Couldn't load the IP list." });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function send(body: { action: "add" | "remove"; ip: string; label?: string }) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setData(json);
      return true;
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Something went wrong." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!ip.trim()) return;
    if (await send({ action: "add", ip: ip.trim(), label: label.trim() })) {
      setMessage({ kind: "ok", text: `${ip.trim()} can now use the admin tools.` });
      setIp("");
      setLabel("");
    }
  }

  async function onRemove(target: string) {
    const isMe = data?.yourIp?.toLowerCase() === target && !data?.envIps.includes(target);
    const warning = isMe
      ? "This is YOUR current IP. Removing it will lock you out of the admin tools from this connection. Continue?"
      : `Remove ${target} from the admin list?`;
    if (!window.confirm(warning)) return;
    if (await send({ action: "remove", ip: target })) {
      setMessage({ kind: "ok", text: `${target} was removed.` });
    }
  }

  const yourIp = data?.yourIp ?? null;
  const youAreListed =
    !!yourIp && (data?.envIps.includes(yourIp.toLowerCase()) || data?.storedIps.some((s) => s.ip === yourIp.toLowerCase()));

  return (
    <div className="space-y-8">
      {data && !data.configured && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Blob storage isn&apos;t connected, so IPs can&apos;t be saved here. Only IPs in the Vercel setting
          ADMIN_ALLOWED_IPS will work.
        </div>
      )}

      <div className="rounded-2xl border border-line bg-mist px-6 py-5">
        <p className="text-sm text-slate">Your current IP address</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <code className="text-xl font-bold text-navy">{yourIp ?? "…"}</code>
          {yourIp && !youAreListed && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setIp(yourIp);
                setLabel("My IP");
              }}
              className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-brand hover:border-brand"
            >
              Use this IP
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-slate">
          Home internet IPs can change from time to time. If you lose access, add your new IP from another allowed
          connection or in Vercel (ADMIN_ALLOWED_IPS).
        </p>
      </div>

      <form onSubmit={onAdd} className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold text-navy">Add an IP address</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="e.g. 203.0.113.25"
            aria-label="IP address"
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Name (e.g. Office, Production team)"
            aria-label="Label"
            maxLength={60}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy || !ip.trim()}
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? "Saving…" : "Add IP"}
          </button>
        </div>
        {message && (
          <p className={`mt-3 text-sm ${message.kind === "ok" ? "text-green-700" : "text-red-700"}`}>{message.text}</p>
        )}
      </form>

      <div>
        <h2 className="text-lg font-bold text-navy">Allowed IP addresses</h2>
        {!data ? (
          <p className="mt-3 text-sm text-slate">Loading…</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {data.envIps.map((e) => (
              <li key={`env-${e}`} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <code className="font-semibold text-navy">{e}</code>
                <span className="rounded-full bg-mist px-2 py-0.5 text-xs text-slate">Set in Vercel · always allowed</span>
                {yourIp?.toLowerCase() === e && <span className="text-xs font-semibold text-green-700">You</span>}
              </li>
            ))}
            {data.storedIps.map((s) => (
              <li key={s.ip} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <code className="font-semibold text-navy">{s.ip}</code>
                {s.label && <span className="text-slate">{s.label}</span>}
                {yourIp?.toLowerCase() === s.ip && <span className="text-xs font-semibold text-green-700">You</span>}
                <span className="ml-auto text-xs text-slate">Added {new Date(s.addedAt).toLocaleDateString()}</span>
                {!data.envIps.includes(s.ip) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onRemove(s.ip)}
                    className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-red-700 hover:border-red-400 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
            {data.envIps.length === 0 && data.storedIps.length === 0 && (
              <li className="px-5 py-3 text-sm text-slate">No IPs yet.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
