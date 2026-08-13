"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminToggle({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Wrong password");
      return;
    }
    setOpen(false);
    setPassword("");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  if (isAdmin) {
    return (
      <div className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-400/5 px-4 py-1.5 text-xs text-emerald-300">
        <span>Admin mode</span>
        <button
          type="button"
          onClick={logout}
          className="text-white/40 underline decoration-white/20 underline-offset-2 hover:text-white/70"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 w-fit">
      {open ? (
        <form
          onSubmit={login}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/60 py-1 pl-4 pr-1.5"
        >
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-32 bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-black disabled:opacity-50"
          >
            {loading ? "..." : "Go"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/30 transition-colors hover:text-white/60"
        >
          Admin
        </button>
      )}
      {error ? <p className="mt-2 text-center text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
