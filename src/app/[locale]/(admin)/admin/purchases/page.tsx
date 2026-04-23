import { BadgeIndianRupee, Droplets, WalletCards } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PurchaseManagementPanel } from "@/components/purchases/purchase-management-panel";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminCard, AdminStatCard } from "@/components/layout/admin-ui";
import { getProductsData, getPurchaseLedgerData, getVendorsData } from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";

type AdminPurchasesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPurchasesPage({ params }: AdminPurchasesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.purchases" });
  const [ledger, vendors, products] = await Promise.all([
    getPurchaseLedgerData(),
    getVendorsData(),
    getProductsData(),
  ]);

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          label={t("stats.total")}
          value={formatCurrencyINR(ledger.summary.totalPurchaseAmount)}
          hint={t("stats.totalHint")}
          icon={BadgeIndianRupee}
        />
        <AdminStatCard
          label={t("stats.milkInward")}
          value={`${ledger.summary.totalMilkInward.toFixed(1)} L`}
          hint={t("stats.milkInwardHint")}
          icon={Droplets}
          tone="success"
        />
        <AdminStatCard
          label={t("stats.unpaid")}
          value={String(ledger.summary.unpaidEntries)}
          hint={t("stats.unpaidHint")}
          icon={WalletCards}
          tone="warning"
        />
      </div>

      <AdminCard>
        <p className="text-sm text-[var(--admin-muted)]">{t("note")}</p>
      </AdminCard>

      <PurchaseManagementPanel
        entries={ledger.entries}
        vendors={vendors.map((vendor) => ({ code: vendor.code, name: vendor.name }))}
        products={products.map((product) => ({
          code: product.code,
          name: product.name,
          category: product.category,
        }))}
      />
    </AdminShell>
  );
}
