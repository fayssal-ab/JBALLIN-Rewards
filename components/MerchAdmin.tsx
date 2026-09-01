"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MerchItem } from "@/lib/merch";
import { useConfirm } from "@/components/ConfirmDialog";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

async function callApi(body: object) {
  await fetch("/api/admin/merch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const EMPTY_FORM = { name: "", price: "", image_url: "", buy_url: "" };

function ItemRow({ item }: { item: MerchItem }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: item.name,
    price: item.price,
    image_url: item.image_url ?? "",
    buy_url: item.buy_url ?? "",
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await callApi({ action: "update", id: item.id, ...form });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  async function toggleActive() {
    setBusy(true);
    await callApi({ action: "active", id: item.id, active: !item.active });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!(await confirm(`Delete "${item.name}"?`, { danger: true }))) return;
    setBusy(true);
    await callApi({ action: "delete", id: item.id });
    setBusy(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name"
          className="w-40 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-sm text-white"
        />
        <input
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="Price"
          className="w-20 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-sm text-white"
        />
        <input
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          placeholder="Image URL (optional)"
          className="w-48 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-sm text-white"
        />
        <input
          value={form.buy_url}
          onChange={(e) => setForm({ ...form, buy_url: e.target.value })}
          placeholder="Buy URL (optional)"
          className="w-48 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-sm text-white"
        />
        <button
          onClick={save}
          disabled={busy}
          className="rounded-md border border-emerald-400/30 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-xs text-white/40 hover:text-white/70"
        >
          Cancel
        </button>
      </div>
    );
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
          {item.buy_url ? "" : " · no buy link yet"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs">
        <button onClick={() => setEditing(true)} className="text-white/50 hover:text-emerald-300">
          Edit
        </button>
        <button onClick={toggleActive} disabled={busy} className="text-white/50 hover:text-emerald-300">
          {item.active ? "Hide" : "Show"}
        </button>
        <button onClick={remove} disabled={busy} className="text-white/30 hover:text-red-400">
          Delete
        </button>
      </div>
    </div>
  );
}

export function MerchAdmin({ items }: { items: MerchItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setBusy(true);
    await callApi({ action: "add", ...form });
    setForm(EMPTY_FORM);
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <p className="mt-4 max-w-md text-sm text-white/60">
        Items marked &quot;Hide&quot; stay in the list but drop off the
        public /merch page. Leave Buy URL empty to show a &quot;Coming
        soon&quot; button until the real Printful link is ready.
      </p>

      <div className="mt-6 space-y-2">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>

      <form onSubmit={addItem} className="mt-6 flex flex-wrap items-center gap-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name"
          className="w-40 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
        <input
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="Price"
          className="w-24 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
        <input
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          placeholder="Image URL (optional)"
          className="w-48 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
        <input
          value={form.buy_url}
          onChange={(e) => setForm({ ...form, buy_url: e.target.value })}
          placeholder="Buy URL (optional)"
          className="w-48 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Add item
        </button>
      </form>
    </div>
  );
}
