"use client";

import { Pencil, LogOut } from "lucide-react";

type Props = {
  editUrl: string;
  email: string;
};

export function SmartActionButton({ editUrl, email }: Props) {
  return (
    <div
      role="toolbar"
      aria-label="Admin actions"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-slate-900/95 px-2 py-1.5 shadow-xl shadow-black/30 backdrop-blur"
    >
      <span
        title={email}
        className="ml-1 mr-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white"
      >
        {(email[0] ?? "?").toUpperCase()}
      </span>
      <a
        href={editUrl}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
        title="Diese Seite bearbeiten"
        aria-label="Bearbeiten"
      >
        <Pencil className="h-4 w-4" />
      </a>
      <form action="/api/auth/logout" method="POST" className="inline-flex">
        <button
          type="submit"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
          title="Abmelden"
          aria-label="Abmelden"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
