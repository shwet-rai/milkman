"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart2, Eye, FilePenLine, MoreVertical, PauseCircle, SkipForward, Truck } from "lucide-react";

type CustomerCardActionsProps = {
  customerCode: string;
  locale: string;
};

export function CustomerCardActions({ customerCode, locale }: CustomerCardActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState<"DELIVERED" | "SKIPPED" | "PAUSED" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleDeliveryAction(status: "DELIVERED" | "SKIPPED" | "PAUSED") {
    setLoading(status);
    try {
      await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerCode, status }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* Delivered */}
      <button
        type="button"
        onClick={() => handleDeliveryAction("DELIVERED")}
        disabled={loading !== null}
        className="admin-primary-button px-4 py-3 text-sm font-semibold disabled:opacity-60"
      >
        <Truck className="h-4 w-4" />
        {loading === "DELIVERED" ? "Saving…" : "Delivered"}
      </button>

      {/* Skipped */}
      <button
        type="button"
        onClick={() => handleDeliveryAction("SKIPPED")}
        disabled={loading !== null}
        className="admin-secondary-button px-4 py-3 text-sm font-semibold disabled:opacity-60"
      >
        <SkipForward className="h-4 w-4" />
        {loading === "SKIPPED" ? "Saving…" : "Skipped"}
      </button>

      {/* Paused */}
      <button
        type="button"
        onClick={() => handleDeliveryAction("PAUSED")}
        disabled={loading !== null}
        className="admin-outline-button px-4 py-3 text-sm font-semibold disabled:opacity-60"
      >
        <PauseCircle className="h-4 w-4" />
        {loading === "PAUSED" ? "Saving…" : "Paused"}
      </button>

      {/* 3-dot menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="admin-outline-button px-3 py-3 text-sm font-semibold"
          aria-label="More options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-[16px] border border-[var(--admin-border)] bg-white shadow-lg">
            <Link
              href={`/${locale}/admin/customers/${customerCode}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--admin-text)] hover:bg-[var(--admin-panel-muted)] transition-colors"
            >
              <Eye className="h-4 w-4 text-[var(--admin-muted)]" />
              View
            </Link>
            <Link
              href={`/${locale}/admin/customers/${customerCode}?tab=analytics`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--admin-text)] hover:bg-[var(--admin-panel-muted)] transition-colors"
            >
              <BarChart2 className="h-4 w-4 text-[var(--admin-muted)]" />
              Details
            </Link>
            <Link
              href={`/${locale}/admin/customers/${customerCode}/edit`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--admin-text)] hover:bg-[var(--admin-panel-muted)] transition-colors"
            >
              <FilePenLine className="h-4 w-4 text-[var(--admin-muted)]" />
              Edit
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
