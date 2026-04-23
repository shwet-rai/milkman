import Link from "next/link";
import { CirclePlus, Filter, Search, UserRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminBadge, AdminButton, AdminCard } from "@/components/layout/admin-ui";
import { CustomerCardActions } from "@/components/customers/customer-card-actions";
import { getCustomerListData } from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";

type AdminCustomersPageProps = {
  params: Promise<{ locale: string }>;
};

function getStatusTone(status: string) {
  if (status === "ACTIVE") return "success";
  if (status === "PAUSED") return "warning";
  return "danger";
}

function getStatusKey(status: string): "active" | "paused" | "pending" {
  if (status === "ACTIVE") return "active";
  if (status === "PAUSED") return "paused";
  return "pending";
}

export default async function AdminCustomersPage({
  params,
}: AdminCustomersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.customers" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tStatus = await getTranslations({ locale, namespace: "status" });
  const customers = await getCustomerListData();

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <AdminCard>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">{t("listTitle")}</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">{t("listSubtitle")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="admin-secondary-button w-full justify-start gap-3 px-4 py-3 sm:w-[280px]">
              <Search className="h-4 w-4 text-[var(--admin-muted)]" />
              <span className="text-sm font-medium text-[var(--admin-muted)]">
                {t("searchPlaceholder")}
              </span>
            </div>
            <AdminButton variant="secondary">
              <Filter className="h-4 w-4" />
              {tCommon("filter")}
            </AdminButton>
            <Link
              href={`/${locale}/admin/customers/new`}
              className="admin-primary-button px-4 py-3 text-sm font-semibold"
            >
              <CirclePlus className="h-4 w-4" />
              {t("addCustomer")}
            </Link>
          </div>
        </div>
      </AdminCard>

      <section className="grid gap-3">
        {customers.map((customer) => (
          <article key={customer.customerCode} className="admin-panel rounded-[28px] p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[var(--admin-text)]">{customer.name}</h3>
                    <AdminBadge tone={getStatusTone(customer.status)}>
                      {tStatus(getStatusKey(customer.status))}
                    </AdminBadge>
                    <AdminBadge tone={customer.due > 0 ? "warning" : "success"}>
                      {customer.due > 0 ? tStatus("duePending") : tStatus("upToDate")}
                    </AdminBadge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">{customer.areaName}</p>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">{customer.address}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--admin-muted)]">
                    {t("codeLine", {
                      code: customer.customerCode,
                      area: customer.areaCode,
                      slot: customer.deliverySlot,
                    })}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[470px]">
                <div className="rounded-[20px] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                    {t("plan")}
                  </p>
                  <p className="mt-2 text-base font-semibold text-[var(--admin-text)]">
                    {customer.quantityLabel}
                  </p>
                </div>
                <div className="rounded-[20px] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                    {t("rate")}
                  </p>
                  <p className="mt-2 text-base font-semibold text-[var(--admin-text)]">
                    {formatCurrencyINR(customer.rate)}
                  </p>
                </div>
                <div className="rounded-[20px] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                    {t("due")}
                  </p>
                  <p className="mt-2 text-base font-semibold text-[var(--admin-text)]">
                    {formatCurrencyINR(customer.due)}
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-divider my-5" />

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2 text-sm text-[var(--admin-muted)]">
                <span className="admin-panel-muted rounded-full px-3 py-1.5">{customer.phone}</span>
                <span className="admin-panel-muted rounded-full px-3 py-1.5">
                  {customer.notes ? t("notesAvailable") : t("noNote")}
                </span>
              </div>
              <CustomerCardActions
                customerCode={customer.customerCode}
                locale={locale}
              />
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
