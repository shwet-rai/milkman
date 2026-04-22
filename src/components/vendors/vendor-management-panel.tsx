"use client";

import { useEffect, useMemo, useState } from "react";
import { Store, PencilLine, Plus, Trash2 } from "lucide-react";
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

export function VendorManagementPanel({ initialVendors, areas }: VendorManagementPanelProps) {
  const router = useRouter();
  const [vendors, setVendors] = useState(initialVendors);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    phone: "",
    areaCode: areas[0]?.code || "",
    notes: "",
    isActive: true,
  });
  const [error, setError] = useState("");
  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.code === selectedCode) || null,
    [selectedCode, vendors],
  );

  useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);

  function loadVendor(vendor: VendorRecord) {
    setSelectedCode(vendor.code);
    setForm({
      code: vendor.code,
      name: vendor.name,
      phone: vendor.phone || "",
      areaCode: vendor.areaCode || areas[0]?.code || "",
      notes: vendor.notes || "",
      isActive: vendor.isActive !== false,
    });
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
          const next = current.filter((vendor) => vendor.code !== selectedCode && vendor.code !== data.vendor?.code);
          return [data.vendor as VendorRecord, ...next].sort((left, right) =>
            left.name.localeCompare(right.name),
          );
        });
      }
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
      setVendors((current) => current.filter((vendor) => vendor.code !== selectedCode));
      setSelectedCode(null);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to delete vendor");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <AdminCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">Vendors</h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                Suppliers for daily milk purchase.
              </p>
            </div>
            <AdminButton
              onClick={() => {
                setSelectedCode(null);
                setForm({
                  code: "",
                  name: "",
                  phone: "",
                  areaCode: areas[0]?.code || "",
                  notes: "",
                  isActive: true,
                });
              }}
            >
              <Plus className="h-4 w-4" />
              New
            </AdminButton>
          </div>
          <div className="mt-5 space-y-3">
            {vendors.map((vendor) => (
              <button
                key={vendor.code}
                type="button"
                onClick={() => loadVendor(vendor)}
                className="admin-panel-muted w-full rounded-[24px] p-4 text-left"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--admin-text)]">{vendor.name}</p>
                      <AdminBadge tone={vendor.isActive === false ? "warning" : "success"}>
                        {vendor.isActive === false ? "Inactive" : "Active"}
                      </AdminBadge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--admin-muted)]">
                      {vendor.code} • {vendor.areaName || vendor.areaCode || "No area"} •{" "}
                      {vendor.phone || "No phone"}
                    </p>
                    <p className="mt-2 text-sm text-[var(--admin-muted)]">
                      {vendor.purchaseCount || 0} purchase rows •{" "}
                      {formatCurrencyINR(vendor.totalPurchaseAmount || 0)}
                    </p>
                  </div>
                  <PencilLine className="h-4 w-4 text-[var(--admin-muted)]" />
                </div>
              </button>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                Vendor purchase history
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                Select a vendor to inspect recent inward purchase activity.
              </p>
            </div>
            {selectedVendor ? (
              <AdminBadge tone={selectedVendor.unpaidEntries ? "warning" : "success"}>
                {selectedVendor.unpaidEntries || 0} unpaid
              </AdminBadge>
            ) : null}
          </div>

          {selectedVendor ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[18px] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                    Purchase total
                  </p>
                  <p className="mt-2 font-semibold text-[var(--admin-text)]">
                    {formatCurrencyINR(selectedVendor.totalPurchaseAmount || 0)}
                  </p>
                </div>
                <div className="rounded-[18px] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                    Milk inward
                  </p>
                  <p className="mt-2 font-semibold text-[var(--admin-text)]">
                    {(selectedVendor.totalMilkInward || 0).toFixed(1)} L
                  </p>
                </div>
                <div className="rounded-[18px] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                    Rows
                  </p>
                  <p className="mt-2 font-semibold text-[var(--admin-text)]">
                    {selectedVendor.purchaseCount || 0}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedVendor.recentPurchases?.length ? (
                  selectedVendor.recentPurchases.map((entry) => (
                    <div key={entry.id} className="admin-panel-muted rounded-[22px] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--admin-text)]">
                            {entry.productName}
                          </p>
                          <p className="mt-1 text-sm text-[var(--admin-muted)]">
                            {entry.dateLabel} • {entry.quantity} {entry.unit}
                          </p>
                        </div>
                        <AdminBadge
                          tone={entry.paymentStatus === "PAID" ? "success" : "warning"}
                        >
                          {entry.paymentStatus}
                        </AdminBadge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                        <p className="font-medium text-[var(--admin-text)]">
                          {formatCurrencyINR(entry.totalAmount)}
                        </p>
                        <p className="text-[var(--admin-muted)]">
                          {entry.note || entry.productCode}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="admin-panel-muted rounded-[22px] p-4 text-sm text-[var(--admin-muted)]">
                    No purchase rows found for this vendor in the current month.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5 admin-panel-muted rounded-[22px] p-4 text-sm text-[var(--admin-muted)]">
              Select a vendor from the list to view purchase history.
            </div>
          )}
        </AdminCard>
      </div>

      <AdminCard>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)]">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">Vendor CRUD</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">Create or update vendor records.</p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <AdminField label="Vendor code">
            <AdminInput value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
          </AdminField>
          <AdminField label="Name">
            <AdminInput value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </AdminField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Phone">
              <AdminInput value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </AdminField>
            <AdminField label="Area">
              <AdminSelect value={form.areaCode} onChange={(event) => setForm((current) => ({ ...current, areaCode: event.target.value }))}>
                {areas.map((area) => (
                  <option key={area.code} value={area.code}>
                    {area.code} • {area.name}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </div>
          <AdminField label="Note">
            <AdminInput value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </AdminField>
          <AdminField label="Status">
            <AdminSelect value={form.isActive ? "ACTIVE" : "INACTIVE"} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === "ACTIVE" }))}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </AdminSelect>
          </AdminField>
          {error ? <div className="rounded-[18px] bg-[var(--admin-danger-soft)] px-4 py-3 text-sm font-medium text-[#d14646]">{error}</div> : null}
          <div className="grid gap-2 sm:grid-cols-3">
            <AdminButton className="justify-center" onClick={saveVendor}>Save</AdminButton>
            <AdminButton variant="secondary" className="justify-center" onClick={() => setForm({ code: "", name: "", phone: "", areaCode: areas[0]?.code || "", notes: "", isActive: true })}>Reset</AdminButton>
            <AdminButton variant="outline" className="justify-center" onClick={deleteVendor} disabled={!selectedCode}>
              <Trash2 className="h-4 w-4" />
              Delete
            </AdminButton>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
