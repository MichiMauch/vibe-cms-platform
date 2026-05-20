import type { Metadata } from "next";
import { getAllRoutes } from "@/lib/sites";
import { renderTenantPage, tenantMetadata } from "@/lib/render-tenant-page";

type Params = { slug: string; locale: string };

export async function generateStaticParams() {
  return getAllRoutes();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  return tenantMetadata(slug, locale, "");
}

export default async function TenantHomePage({ params }: { params: Promise<Params> }) {
  const { slug, locale } = await params;
  return renderTenantPage(slug, locale, "");
}
