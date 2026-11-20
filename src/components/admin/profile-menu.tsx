"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserCircle } from "@phosphor-icons/react";
import { logout } from "@/app/admin/login/actions";

/** The admin account button in the admin header: who is signed in, Blogs, Activity, Log out. */
export function ProfileMenu({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Close on a click outside or Esc.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="grid size-10 place-items-center rounded-full bg-chalk text-ink-soft ring-1 ring-ink/10 transition-colors hover:text-ink"
      >
        <UserCircle size={26} weight="duotone" />
      </button>
      {open ? (
        <div
          role="menu"
          className="admin-fade absolute right-0 top-12 z-40 w-52 rounded-2xl border border-ink/10 bg-chalk p-1.5 text-[14px] font-semibold text-ink shadow-xl"
        >
          <p className="truncate border-b border-ink/10 px-3 pb-2.5 pt-2 text-[12.5px] font-normal text-ink-soft">
            Signed in as <span className="font-semibold text-ink">{username}</span>
          </p>
          <Link role="menuitem" href="/admin/blog/" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-chalk-2">
            Blogs
          </Link>
          <Link role="menuitem" href="/admin/activity/" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-chalk-2">
            Activity
          </Link>
          <form action={logout}>
            <button role="menuitem" type="submit" className="block w-full rounded-xl px-3 py-2.5 text-left text-red-700 hover:bg-red-50">
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
