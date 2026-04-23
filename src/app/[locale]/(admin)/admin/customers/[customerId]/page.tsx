import Link from "next/link";
import { ChevronLeft, FilePenLine, MapPin, Phone, WalletCards } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminBadge, AdminCard } from "@/components/layout/admin-ui";
import { getCustomerDetailData } from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";

type CustomerDetailPageProps = {
  params: Promise<{ locale: string; customerId: string }>;
};

function getStatusTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "PAUSED") return "warning" as const;
  return "danger" as const;
}

function getStatusKey(status: string): "active" | "paused" | "pending" {
  if (status === "ACTIVE") return "active";
  if (status === "PAUSED") return "paused";
  return "pending";
}

function getDeliveryStatusKey(
  status: string,
): "delivered" | "paused" | "skipped" | "pending" {
  if (status === "DELIVERED") return "delivered";
  if (status === "PAUSED") return "paused";
  if (status === "SKIPPED") return "skipped";
  return "pending";
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { locale, customerId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.customers" });
  const tStatus = await getTranslations({ locale, namespace: "status" });
  const customer = await getCustomerDetailData(customerId);

  if (!customer) {
    notFound();
  }

  const statusTone = getStatusTone(customer.status);

  return (
    <AdminShell locale={locale} title={customer.name} subtitle={t("detailSubtitle")}>
      <AdminCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/admin/customers`} className="admin-icon-button h-11 w-11">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-[var(--admin-text)]">{customer.name}</h2>
                <AdminBadge tone={statusTone}>{tStatus(getStatusKey(customer.status))}</AdminBadge>
              </div>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                {t("customerCodeLine", { code: customer.customerCode, area: customer.areaCode })}
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/admin/customers/${customer.customerCode}/edit`}
            className="admin-outline-button px-4 py-3 text-sm font-semibold"
          >
            <FilePenLine className="h-4 w-4" />
            {t("editCustomer")}
          </Link>
        </div>
      </AdminCard>

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <AdminCard>
          <div className="space-y-4">
            <div className="admin-panel-muted rounded-[24px] p-4">
              <div className="flex items-center gap-2 text-[var(--admin-muted)]">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{t("contact")}</span>
              </div>
              <p className="mt-2 text-base font-semibold text-[var(--admin-text)]">
                {customer.phone}
              </p>
            </div>

            <div className="admin-panel-muted rounded-[24px] p-4">
              <div className="flex items-center gap-2 text-[var(--admin-muted)]">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{t("address")}</span>
              </div>
              <p className="mt-2 text-base font-semibold text-[var(--admin-text)]">
                {customer.address}
              </p>
              <p className="mt-2 text-sm text-[var(--admin-muted)]">
                {customer.areaName} • {customer.areaCode}
              </p>
            </div>

            <div className="admin-panel-muted rounded-[24px] p-4">
              <div className="flex items-center gap-2 text-[var(--admin-muted)]">
                <WalletCards className="h-4 w-4" />
                <span className="text-sm">{t("notes")}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--admin-text)]">
                {customer.notes || t("noInternalNote")}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] bg-[var(--admin-primary-soft)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                {t("milkPlan")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">
                {customer.quantityLabel}
              </p>
            </div>
            <div className="rounded-[22px] bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                {t("rate")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">
                {formatCurrencyINR(customer.rate)}
              </p>
            </div>
            <div className="rounded-[22px] bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                {t("due")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">
                {formatCurrencyINR(customer.due)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="admin-panel-muted rounded-[22px] p-4">
              <p className="text-sm text-[var(--admin-muted)]">{t("billedThisMonth")}</p>
              <p className="mt-2 text-xl font-semibold text-[var(--admin-text)]">
                {formatCurrencyINR(customer.billed)}
              </p>
            </div>
            <div className="admin-panel-muted rounded-[22px] p-4">
              <p className="text-sm text-[var(--admin-muted)]">{t("amountPaid")}</p>
              <p className="mt-2 text-xl font-semibold text-[var(--admin-text)]">
                {formatCurrencyINR(customer.paid)}
              </p>
            </div>
          </div>

          <div className="admin-divider my-5" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/${locale}/admin/deliveries`}
              className="admin-primary-button justify-center px-4 py-3 text-sm font-semibold"
            >
              {t("markDeliveryNow")}
            </Link>
            <Link
              href={`/${locale}/admin/billing`}
              className="admin-secondary-button justify-center px-4 py-3 text-sm font-semibold"
            >
              {t("recordPayment")}
            </Link>
            <Link
              href={`/${locale}/admin/customers/${customer.customerCode}/edit`}
              className="admin-outline-button justify-center px-4 py-3 text-sm font-semibold"
            >
              {t("updateProfile")}
            </Link>
          </div>

          <div className="admin-divider my-5" />

          <div>
            <h3 className="text-base font-semibold text-[var(--admin-text)]">
              {t("recentDeliveryLog")}
            </h3>
            <div className="mt-4 space-y-3">
              {customer.recentDeliveries.length ? (
                customer.recentDeliveries.map((entry) => (
                  <div
                    key={`${entry.dateLabel}-${entry.status}`}
                    className="admin-panel-muted rounded-[22px] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--admin-text)]">{entry.dateLabel}</p>
                        <p className="mt-1 text-sm text-[var(--admin-muted)]">
                          {t("deliveredLiters", {
                            final: entry.finalQuantity.toFixed(1),
                            extra: entry.extraQuantity.toFixed(1),
                          })}
                        </p>
                      </div>
                      <AdminBadge
                        tone={
                          entry.status === "DELIVERED"
                            ? "success"
                            : entry.status === "PAUSED"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {tStatus(getDeliveryStatusKey(entry.status))}
                      </AdminBadge>
                    </div>
                    {entry.addOnItems.length ? (
                      <p className="mt-2 text-sm text-[var(--admin-muted)]">
                        {t("addOnsLine", {
                          list: entry.addOnItems
                            .map(
                              (item) =>
                                `${item.productName || item.productCode} x ${item.quantity || 0}`,
                            )
                            .join(", "),
                        })}
                      </p>
                    ) : null}
                    {entry.note ? (
                      <p className="mt-2 text-sm text-[var(--admin-muted)]">{entry.note}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="admin-panel-muted rounded-[22px] p-4 text-sm text-[var(--admin-muted)]">
                  {t("noDeliveryLog")}
                </div>
              )}
            </div>
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
