import { CalendarRange, CircleDollarSign, Droplets, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MonthGrid } from "@/components/calendar/month-grid";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminBadge, AdminCard, AdminStatCard } from "@/components/layout/admin-ui";
import { getAdminCalendarData } from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";

type AdminCalendarPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminCalendarPage({ params }: AdminCalendarPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.calendar" });
  const tLegend = await getTranslations({ locale, namespace: "calendar.legend" });
  const { monthMeta, days, areaBreakdown, summary } = await getAdminCalendarData();

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <div className="grid gap-4 md:grid-cols-4">
        <AdminStatCard
          label={t("stats.monthlyLiters")}
          value={`${summary.totalLiters.toFixed(1)} L`}
          hint={t("stats.monthlyLitersHint")}
          icon={Droplets}
          tone="blue"
        />
        <AdminStatCard
          label={t("stats.activeCustomers")}
          value={`${summary.activeCustomers}`}
          hint={t("stats.activeCustomersHint")}
          icon={Users}
          tone="success"
        />
        <AdminStatCard
          label={t("stats.peakDay")}
          value={`${summary.peakDay.dayOfMonth} ${monthMeta.monthLabel.slice(0, 3)}`}
          hint={t("stats.peakDayHint", { liters: summary.peakDay.liters.toFixed(1) })}
          icon={CalendarRange}
          tone="warning"
        />
        <AdminStatCard
          label={t("stats.revenueEstimate")}
          value={formatCurrencyINR(summary.totalRevenueEstimate)}
          hint={t("stats.revenueEstimateHint")}
          icon={CircleDollarSign}
          tone="danger"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <AdminCard>
          <MonthGrid
            monthLabel={monthMeta.monthLabel}
            leadingBlankSlots={monthMeta.leadingBlankSlots}
            days={days}
            variant="admin"
            legendLabels={{
              delivered: tLegend("delivered"),
              paused: tLegend("paused"),
              skipped: tLegend("skipped"),
            }}
            renderFooter={(day) => (
              <>
                <div>{day.dateLabel}</div>
                <div>
                  {t("dayFooter", {
                    delivered: day.deliveredCount,
                    paused: day.pausedCount,
                    skipped: day.skippedCount,
                  })}
                </div>
              </>
            )}
          />
        </AdminCard>

        <div className="space-y-4">
          <AdminCard>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                  {t("insights.title")}
                </h2>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">{t("insights.subtitle")}</p>
              </div>
              <AdminBadge tone="blue">{t("insights.monthSummary")}</AdminBadge>
            </div>

            <div className="mt-4 space-y-3">
              {areaBreakdown.map((area) => (
                <div key={area.code} className="admin-panel-muted rounded-[22px] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--admin-text)]">{area.name}</p>
                      <p className="mt-1 text-sm text-[var(--admin-muted)]">{area.code}</p>
                    </div>
                    <AdminBadge tone={area.customerCount > 0 ? "success" : "warning"}>
                      {t("insights.customersCount", { count: area.customerCount })}
                    </AdminBadge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[18px] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                        {t("insights.daily")}
                      </p>
                      <p className="mt-2 font-semibold text-[var(--admin-text)]">
                        {area.dailyConsumption.toFixed(1)} L
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                        {t("insights.billed")}
                      </p>
                      <p className="mt-2 font-semibold text-[var(--admin-text)]">
                        {formatCurrencyINR(area.monthlyBilled)}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                        {t("insights.due")}
                      </p>
                      <p className="mt-2 font-semibold text-[var(--admin-text)]">
                        {formatCurrencyINR(area.dueAmount)}
                      </p>
                    </div>
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
