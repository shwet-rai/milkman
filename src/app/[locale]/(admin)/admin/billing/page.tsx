import { BadgeIndianRupee, CircleDollarSign, CreditCard, WalletCards } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PaymentEntryForm } from "@/components/billing/payment-entry-form";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminBadge, AdminCard, AdminStatCard } from "@/components/layout/admin-ui";
import { getBillingData } from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";

type AdminBillingPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminBillingPage({ params }: AdminBillingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.billing" });
  const tStatus = await getTranslations({ locale, namespace: "status" });
  const billing = await getBillingData();

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          label={t("stats.billed")}
          value={formatCurrencyINR(billing.summary.billedAmount)}
          hint={t("stats.billedHint")}
          icon={BadgeIndianRupee}
        />
        <AdminStatCard
          label={t("stats.received")}
          value={formatCurrencyINR(billing.summary.paidAmount)}
          hint={t("stats.receivedHint")}
          icon={WalletCards}
          tone="success"
        />
        <AdminStatCard
          label={t("stats.due")}
          value={formatCurrencyINR(billing.summary.dueAmount)}
          hint={t("stats.dueHint")}
          icon={CircleDollarSign}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <AdminCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                {t("accountsTitle")}
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">{t("accountsSubtitle")}</p>
            </div>
            <AdminBadge tone="blue">
              <CreditCard className="h-3.5 w-3.5" />
              {t("monthEndSummary")}
            </AdminBadge>
          </div>
          <div className="mt-5 grid gap-3">
            {billing.customers.map((account) => (
              <article key={account.customerCode} className="admin-panel-muted rounded-[26px] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[var(--admin-text)]">{account.name}</h3>
                      <AdminBadge tone={account.due > 0 ? "warning" : "success"}>
                        {account.due > 0 ? tStatus("duePending") : tStatus("cleared")}
                      </AdminBadge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--admin-muted)]">
                      {t("ledgerLine", { area: account.areaName, code: account.areaCode })}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[500px]">
                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                        {t("billed")}
                      </p>
                      <p className="mt-2 font-semibold text-[var(--admin-text)]">
                        {formatCurrencyINR(account.billed)}
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                        {t("paid")}
                      </p>
                      <p className="mt-2 font-semibold text-[var(--admin-text)]">
                        {formatCurrencyINR(account.paid)}
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                        {t("due")}
                      </p>
                      <p className="mt-2 font-semibold text-[var(--admin-text)]">
                        {formatCurrencyINR(account.due)}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </AdminCard>

        <div className="space-y-4">
          <PaymentEntryForm
            customers={billing.customers.map((customer) => ({
              customerCode: customer.customerCode,
              name: customer.name,
              areaCode: customer.areaCode,
            }))}
          />

          <AdminCard>
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                {t("recentEntriesTitle")}
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                {t("recentEntriesSubtitle")}
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {billing.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="admin-panel-muted flex flex-col gap-2 rounded-[22px] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--admin-text)]">{payment.customerName}</p>
                    <AdminBadge tone="success">{payment.mode}</AdminBadge>
                  </div>
                  <p className="text-sm text-[var(--admin-muted)]">{payment.dateLabel}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-base font-semibold text-[var(--admin-text)]">
                      {formatCurrencyINR(payment.amount)}
                    </p>
                    <p className="text-sm text-[var(--admin-muted)]">{payment.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminShell>
  );
}
