import { getTranslations, setRequestLocale } from "next-intl/server";
import { AreaManagementPanel } from "@/components/areas/area-management-panel";
import { AdminShell } from "@/components/layout/admin-shell";

type AdminAreasPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminAreasPage({ params }: AdminAreasPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.areas" });

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <AreaManagementPanel />
    </AdminShell>
  );
}
