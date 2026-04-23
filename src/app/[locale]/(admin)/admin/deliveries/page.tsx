import { Clock3, PauseCircle, Truck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DeliveryOperationsPanel } from "@/components/deliveries/delivery-operations-panel";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminCard, AdminStatCard } from "@/components/layout/admin-ui";
import { getDeliveryOperationOptions, getTodayDeliveriesData } from "@/lib/data-service";

type AdminDeliveriesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDeliveriesPage({
  params,
}: AdminDeliveriesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.deliveries" });
  const [entries, options] = await Promise.all([
    getTodayDeliveriesData(),
    getDeliveryOperationOptions(),
  ]);

  const deliveredCount = entries.filter((entry) => entry.status === "DELIVERED").length;
  const pausedOrSkippedCount = entries.filter(
    (entry) => entry.status === "PAUSED" || entry.status === "SKIPPED",
  ).length;
  const pendingCount = entries.filter((entry) => entry.status === "PENDING").length;

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          label={t("stats.delivered")}
          value={String(deliveredCount)}
          hint={t("stats.deliveredHint")}
          icon={Truck}
          tone="success"
        />
        <AdminStatCard
          label={t("stats.pending")}
          value={String(pendingCount)}
          hint={t("stats.pendingHint")}
          icon={Clock3}
          tone="warning"
        />
        <AdminStatCard
          label={t("stats.pausedSkipped")}
          value={String(pausedOrSkippedCount)}
          hint={t("stats.pausedSkippedHint")}
          icon={PauseCircle}
          tone="danger"
        />
      </div>

      <AdminCard>
        <p className="text-sm text-[var(--admin-muted)]">{t("note")}</p>
      </AdminCard>

      <DeliveryOperationsPanel
        entries={entries}
        customers={options.customers.map((customer) => ({
          customerCode: customer.customerCode,
          name: customer.name,
        }))}
        products={options.products.map((product) => ({
          code: product.code,
          name: product.name,
          category: product.category,
        }))}
      />
    </AdminShell>
  );
}
