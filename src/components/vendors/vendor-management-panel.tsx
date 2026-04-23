"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart2,
  Eye,
  FilePenLine,
  MoreVertical,
  PauseCircle,
  Plus,
  ShoppingCart,
  SkipForward,
  Store,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
  AdminSelect,
} from "@/components/layout/admin-ui";
import { formatCurrencyINR } from "@/lib/utils";

type VendorRecord = {
  code: string;
  name: string;
  phone?: string;
  areaCode?: string;
  areaName?: string;
  notes?: string;
  isActive?: boolean;
  purchaseCount?: number;
  totalPurchaseAmount?: number;
  totalMilkInward?: number;
  unpaidEntries?: number;
  recentPurchases?: Array<{
    id: string;
    productName: string;
    productCode: string;
    quantity: number;
    unit: string;
    totalAmount: number;
    paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
    dateLabel: string;
    note: string;
  }>;
};

type VendorManagementPanelProps = {
  initialVendors: VendorRecord[];
  areas: Array<{ code: string; name: string }>;
};

// ── Vendor card 3-dot menu + action buttons ──────────────────────────────────

type VendorCardActionsProps = {
  vendor: VendorRecord;
  onEdit: (vendor: VendorRecord) => void;
};

function VendorCardActions({ vendor, onEdit }: VendorCardActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
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

  async function handleAction(action: "purchase" | "skipped" | "paused") {
    if (action === "purchase") {
      // Navigate to purchases page filtered by vendor
      router.push(`/en/admin/purchases?vendor=${vendor.code}`);
      return;
    }

    setLoading(action);
    try {
      // Toggle vendor active status for paused
      if (action === "paused") {
        await fetch(`/api/vendors/${vendor.code}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: false }),
        });
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* Purchase */}
      <button
        type="button"
        onClick={() => handleAction("purchase")}
        disabled={loading !== null}
        className="admin-primary-button px-4 py-3 text-sm font-semibold disabled:opacity-60"
      >
        <ShoppingCart className="h-4 w-4" />
        Purchase
      </button>

      {/* Skipped */}
      <button
        type="button"
        onClick={() => handleAction("skipped")}
        disabled={loading !== null}
        className="admin-secondary-button px-4 py-3 text-sm font-semibold disabled:opacity-60"
      >
        <SkipForward className="h-4 w-4" />
        {loading === "skipped" ? "Saving…" : "Skipped"}
      </button>

      {/* Paused */}
      <button
        type="button"
        onClick={() => handleAction("paused")}
        disabled={loading !== null}
        className="admin-outline-button px-4 py-3 text-sm font-semibold disabled:opacity-60"
      >
        <PauseCircle className="h-4 w-4" />
        {loading === "paused" ? "Saving…" : "Paused"}
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
            <button
              type="button"
              onClick={() => { setMenuOpen(false); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--admin-text)] hover:bg-[var(--admin-panel-muted)] transition-colors"
            >
              <Eye className="h-4 w-4 text-[var(--admin-muted)]" />
              View
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--admin-text)] hover:bg-[var(--admin-panel-muted)] transition-colors"
            >
              <BarChart2 className="h-4 w-4 text-[var(--admin-muted)]" />
              Details
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onEdit(vendor); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--admin-text)] hover:bg-[var(--admin-panel-muted)] transition-colors"
            >
              <FilePenLine className="h-4 w-4 text-[var(--admin-muted)]" />
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function VendorManagementPanel({ initialVendors, areas }: VendorManagementPanelProps) {
  const router = useRouter();
  const [vendors, setVendors] = useState(initialVendors);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    phone: "",
    areaCode: areas[0]?.code || "",
    notes: "",
    isActive: true,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);

  function openNewForm() {
    setSelectedCode(null);
    setForm({ code: "", name: "", phone: "", areaCode: areas[0]?.code || "", notes: "", isActive: true });
    setFormVisible(true);
    setError("");
  }

  function openEditForm(vendor: VendorRecord) {
    setSelectedCode(vendor.code);
    setForm({
      code: vendor.code,
      name: vendor.name,
      phone: vendor.phone || "",
      areaCode: vendor.areaCode || areas[0]?.code || "",
      notes: vendor.notes || "",
      isActive: vendor.isActive !== false,
    });
    setFormVisible(true);
    setError("");
    // Scroll to form
    setTimeout(() => {
      document.getElementById("vendor-form-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function saveVendor() {
    setError("");
    try {
      const response = await fetch(
        selectedCode ? `/api/vendors/${selectedCode}` : "/api/vendors",
        {
          method: selectedCode ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = (await response.json()) as { error?: string; vendor?: VendorRecord };
      if (!response.ok) throw new Error(data.error || "Unable to save vendor");
      if (data.vendor) {
        setSelectedCode(data.vendor.code);
        setVendors((current) => {
          const next = current.filter(
            (v) => v.code !== selectedCode && v.code !== data.vendor?.code,
          );
          return [data.vendor as VendorRecord, ...next].sort((a, b) => a.name.localeCompare(b.name));
        });
      }
      setFormVisible(false);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save vendor");
    }
  }

  async function deleteVendor() {
    if (!selectedCode) return;
    setError("");
    try {
      const response = await fetch(`/api/vendors/${selectedCode}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to delete vendor");
      setVendors((current) => current.filter((v) => v.code !== selectedCode));
      setSelectedCode(null);
      setFormVisible(false);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to delete vendor");
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Vendor listing ── */}
      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">Vendors</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Suppliers for daily milk purchase.
            </p>
          </div>
          <AdminButton onClick={openNewForm}>
            <Plus className="h-4 w-4" />
            New
          </AdminButton>
        </div>

        <div className="mt-5 space-y-3">
          {vendors.map((vendor) => (
            <article key={vendor.code} className="admin-panel rounded-[28px] p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                {/* Left: vendor info */}
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[var(--admin-text)]">{vendor.name}</h3>
                      <AdminBadge tone={vendor.isActive === false ? "warning" : "success"}>
                        {vendor.isActive === false ? "Inactive" : "Active"}
                      </AdminBadge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--admin-muted)]">
                      {vendor.areaName || vendor.areaCode || "No area"}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--admin-muted)]">
                      {vendor.code}
                      {vendor.phone ? ` • ${vendor.phone}` : ""}
                    </p>
                  </div>
                </div>

                {/* Right: stats */}
                <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                  <div className="rounded-[20px] bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                      Purchases
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--admin-text)]">
                      {vendor.purchaseCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-[20px] bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                      Milk inward
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--admin-text)]">
                      {(vendor.totalMilkInward ?? 0).toFixed(1)} L
                    </p>
                  </div>
                  <div className="rounded-[20px] bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                      Total paid
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--admin-text)]">
                      {formatCurrencyINR(vendor.totalPurchaseAmount ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="admin-divider my-5" />

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2 text-sm text-[var(--admin-muted)]">
                  {vendor.phone && (
                    <span className="admin-panel-muted rounded-full px-3 py-1.5">{vendor.phone}</span>
                  )}
                  {vendor.unpaidEntries ? (
                    <span className="admin-panel-muted rounded-full px-3 py-1.5">
                      {vendor.unpaidEntries} unpaid
                    </span>
                  ) : null}
                  {vendor.notes && (
                    <span className="admin-panel-muted rounded-full px-3 py-1.5">Notes available</span>
                  )}
                </div>
                <VendorCardActions vendor={vendor} onEdit={openEditForm} />
              </div>
            </article>
          ))}

          {vendors.length === 0 && (
            <div className="admin-panel-muted rounded-[22px] p-6 text-center text-sm text-[var(--admin-muted)]">
              No vendors found. Add your first vendor using the button above.
            </div>
          )}
        </div>
      </AdminCard>

      {/* ── Vendor CRUD form (shown on New / Edit) ── */}
      {formVisible && (
        <AdminCard>
          <div id="vendor-form-card" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)]">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                {selectedCode ? "Edit Vendor" : "New Vendor"}
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                {selectedCode ? "Update vendor details below." : "Fill in the details to create a vendor."}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <AdminField label="Vendor code">
              <AdminInput
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                disabled={!!selectedCode}
              />
            </AdminField>
            <AdminField label="Name">
              <AdminInput
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </AdminField>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Phone">
                <AdminInput
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Area">
                <AdminSelect
                  value={form.areaCode}
                  onChange={(e) => setForm((f) => ({ ...f, areaCode: e.target.value }))}
                >
                  {areas.map((area) => (
                    <option key={area.code} value={area.code}>
                      {area.code} • {area.name}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
            </div>
            <AdminField label="Note">
              <AdminInput
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Status">
              <AdminSelect
                value={form.isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "ACTIVE" }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </AdminSelect>
            </AdminField>

            {error && (
              <div className="rounded-[18px] bg-[var(--admin-danger-soft)] px-4 py-3 text-sm font-medium text-[#d14646]">
                {error}
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-4">
              <AdminButton className="justify-center" onClick={saveVendor}>
                Save
              </AdminButton>
              <AdminButton
                variant="secondary"
                className="justify-center"
                onClick={() =>
                  setForm({ code: "", name: "", phone: "", areaCode: areas[0]?.code || "", notes: "", isActive: true })
                }
              >
                Reset
              </AdminButton>
              <AdminButton
                variant="outline"
                className="justify-center"
                onClick={deleteVendor}
                disabled={!selectedCode}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </AdminButton>
              <AdminButton
                variant="outline"
                className="justify-center"
                onClick={() => setFormVisible(false)}
              >
                Cancel
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
