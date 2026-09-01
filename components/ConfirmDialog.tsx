"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  message: string;
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

// Site-wide replacement for window.confirm(), which renders as a jarring
// native browser popup that breaks the site's own look. Call sites just
// swap `confirm("...")` for `await confirm("...")` — same boolean contract.
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((message, options) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setPending({ message, ...options });
    });
  }, []);

  function settle(value: boolean) {
    resolver.current?.(value);
    resolver.current = null;
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) settle(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            {pending.title ? (
              <h2 className="font-display text-xl uppercase text-white">{pending.title}</h2>
            ) : null}
            <p className="mt-1 text-sm text-white/70">{pending.message}</p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => settle(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/60 hover:border-white/20 hover:text-white"
              >
                {pending.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => settle(true)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-transform hover:scale-105 ${
                  pending.danger
                    ? "bg-red-500 text-white"
                    : "bg-emerald-400 text-black"
                }`}
              >
                {pending.confirmLabel ?? "OK"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}
