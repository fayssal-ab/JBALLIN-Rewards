"use client";

import { useState } from "react";

// Front-end only — there's no mailing-list backend yet (nothing in
// CLAUDE.md's schema for it), so this just confirms locally rather than
// pretending to persist an email address somewhere.
export function StoreSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-[#E0DCD6] bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
      <p className="text-lg font-bold text-[#1A1A1A]">Get notified on new drops</p>
      <p className="mt-1 text-sm text-[#2D2D2D]">
        No spam — just a heads up when new merch goes live.
      </p>
      {submitted ? (
        <p className="mt-4 text-sm font-semibold text-[#E85D04]">
          Thanks — we&apos;ll keep you posted.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full flex-1 rounded-lg border border-[#E0DCD6] bg-[#F8F6F3] px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#2D2D2D]/40 focus:border-[#E85D04] focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#E85D04] px-6 py-2.5 text-sm font-bold text-white uppercase transition-colors duration-200 hover:bg-[#FF6B35]"
          >
            Notify me
          </button>
        </form>
      )}
    </div>
  );
}
