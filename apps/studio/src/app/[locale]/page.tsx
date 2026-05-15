import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { BlockRenderer } from "@vibe-cms-platform/core/renderer";
import { resolveTenant, isAdminHost } from "@/lib/platform/registry";
import {
  readSiteContent,
  siteLocaleExists,
} from "@/lib/platform/site-content";

export const dynamic = "force-dynamic";

const FALLBACK = {
  title: "Vibe-CMS",
  description: "Eine Multi-Tenant-Landingpage-Plattform.",
};

type Params = { locale: string };
type SearchParams = { site?: string };

async function getTenant(searchParams: Promise<SearchParams>): Promise<string | null> {
  const h = await headers();
  const host = h.get("host") ?? "";
  if (isAdminHost(host)) return null;
  const sp = await searchParams;
  return resolveTenant({ host, override: sp.site });
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const slug = await getTenant(searchParams);
  const { locale } = await params;
  if (!slug || !(await siteLocaleExists(slug, locale))) return {};

  const { seo } = await readSiteContent(slug, locale);
  const title = seo.title?.trim() || FALLBACK.title;
  const description = seo.description?.trim() || FALLBACK.description;
  const ogTitle = seo.ogTitle?.trim() || title;
  const ogDescription = seo.ogDescription?.trim() || description;
  const ogImage = seo.ogImage?.trim() || undefined;
  const keywords = seo.keywords
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title: { absolute: title },
    description,
    keywords: keywords && keywords.length > 0 ? keywords : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: "website",
      locale,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const h = await headers();
  const host = h.get("host") ?? "";
  // Admin host should never render a public page — send to admin dashboard.
  if (isAdminHost(host)) redirect("/admin/master/sites");

  const slug = await getTenant(searchParams);
  if (!slug) notFound();

  const { locale } = await params;
  if (!(await siteLocaleExists(slug, locale))) notFound();

  const content = await readSiteContent(slug, locale);
  return <BlockRenderer sections={content.sections} />;
}
