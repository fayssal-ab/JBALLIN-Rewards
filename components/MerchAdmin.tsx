"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MerchItem, MerchCategory, ShopifySyncLogEntry } from "@/lib/merch";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

async function toggleActive(id: number, active: boolean) {
  await fetch("/api/admin/merch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "active", id, active }),
  });
}

function ItemRow({ item, category }: { item: MerchItem; category: MerchCategory | undefined }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onToggle() {
    setBusy(true);
    await toggleActive(item.id, !item.active);
    setBusy(false);
    router.refresh();
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${
        item.active ? "border-white/10 bg-zinc-900/50" : "border-white/5 bg-zinc-900/20 opacity-50"
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-white">{item.name}</p>
        <p className="text-xs text-white/40">
          {currency.format(Number(item.price))}
          {category ? ` · ${category.name}` : ""}
        </p>
      </div>
      <button
        onClick={onToggle}
        disabled={busy}
        className="shrink-0 text-xs text-white/50 hover:text-emerald-300 disabled:opacity-50"
      >
        {item.active ? "Hide" : "Show"}
      </button>
    </div>
  );
}

function SyncStatus({ log }: { log: ShopifySyncLogEntry | null }) {
  if (!log) {
    return <p className="mt-1 text-sm text-white/50">Never synced yet.</p>;
  }
  const when = new Date(log.fetched_at).toLocaleString();
  if (log.status === "failure") {
    return (
      <p className="mt-1 text-sm text-red-400">
        Last sync failed {when} — {log.error_message}. Showing the last good data.
      </p>
    );
  }
  return (
    <p className="mt-1 text-sm text-emerald-300">
      Synced {log.items_synced} product{log.items_synced === 1 ? "" : "s"} · {when}
    </p>
  );
}

export function MerchAdmin({
  connected,
  shopDomain,
  lastSync,
  items,
  categories,
}: {
  connected: boolean;
  shopDomain: string | null;
  lastSync: ShopifySyncLogEntry | null;
  items: MerchItem[];
  categories: MerchCategory[];
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  async function runSync() {
    setSyncing(true);
    await fetch("/api/admin/shopify/sync", { method: "POST" });
    setSyncing(false);
    router.refresh();
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  if (!connected) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        <p className="text-sm text-white/60">
          Not connected to Shopify yet. Connect once and products/categories
          sync in automatically — nothing is entered by hand here.
        </p>
        <a
          href="/api/admin/shopify/connect"
          className="mt-4 inline-block rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-black"
        >
          Connect to Shopify
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
        <div>
          <p className="text-sm text-white/70">
            Connected to <span className="text-emerald-300">{shopDomain}</span>
          </p>
          <SyncStatus log={lastSync} />
        </div>
        <button
          onClick={runSync}
          disabled={syncing}
          className="rounded-md border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Sync now"}
        </button>
      </div>

      <p className="mt-4 text-xs text-white/40">
        Data comes straight from Shopify. Hide an item to pull it off the
        public page without touching Shopify itself.
      </p>

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-white/40">
            No products synced yet — click &quot;Sync now&quot; above.
          </p>
        ) : (
          items.map((item) => (
            <ItemRow key={item.id} item={item} category={categoryById.get(item.category_id ?? -1)} />
          ))
        )}
      </div>
    </div>
  );
}
