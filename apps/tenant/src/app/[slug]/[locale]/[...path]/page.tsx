import type { Metadata } from "next";
import { getAllPageRoutes } from "@/lib/sites";
import { renderTenantPage, tenantMetadata } from "@/lib/render-tenant-page";

type Params = { slug: string; locale: string; path: string[] };

export async function generateStaticParams() {
  // Filter out the homepage — that one is served by ../page.tsx (path=[]).
  return getAllPageRoutes().filter((r) => r.path.length > 0);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, locale, path } = await params;
  return tenantMetadata(slug, locale, path.join("/"));
}

export default async function TenantSubPage({ params }: { params: Promise<Params> }) {
  const { slug, locale, path } = await params;
  return renderTenantPage(slug, locale, path.join("/"));
}
