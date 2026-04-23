import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductManagementPanel } from "@/components/products/product-management-panel";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminCard } from "@/components/layout/admin-ui";
import { getProductsData } from "@/lib/data-service";

type AdminProductsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminProductsPage({ params }: AdminProductsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.products" });
  const products = await getProductsData();

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <AdminCard>
        <p className="text-sm text-[var(--admin-muted)]">{t("note")}</p>
      </AdminCard>
      <ProductManagementPanel initialProducts={products} />
    </AdminShell>
  );
}
