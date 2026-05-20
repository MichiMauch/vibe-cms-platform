import type { Metadata } from "next";
import { Render } from "@puckeditor/core/rsc";
import { buildPuckConfig } from "@vibe-cms-platform/core/puck";
import { renderTheme, VibeProvider, resolveAutoLayouts } from "@vibe-cms-platform/core/theme";
import { getAllRoutes, getSiteData } from "@/lib/sites";

type Params = { slug: string; locale: string };

export async function generateStaticParams() {
  return getAllRoutes();
}

const FALLBACK = {
  title: "Vibe-CMS",
  description: "Eine Multi-Tenant-Landingpage-Plattform.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const { content } = getSiteData(slug, locale);
  const seo = content.root.props?.seo;
  const title = seo?.title?.trim() || FALLBACK.title;
  const description = seo?.description?.trim() || FALLBACK.description;
  const ogTitle = seo?.ogTitle?.trim() || title;
  const ogDescription = seo?.ogDescription?.trim() || description;
  const ogImage = seo?.ogImage?.trim() || undefined;
  const keywords = seo?.keywords
    ?.split(",")
    .map((k: string) => k.trim())
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

export default async function TenantPage({ params }: { params: Promise<Params> }) {
  const { slug, locale } = await params;
  const { content, config: siteConfig } = getSiteData(slug, locale);
  const { themeCss, bodyAttrs } = renderTheme(siteConfig.theme);
  const vibeId = siteConfig.theme?.preset ?? null;
  // Resolve "auto" layouts to the active vibe's defaults before rendering.
  // Blocks themselves stay vibe-agnostic; the transform makes "auto" → concrete.
  const resolvedContent = resolveAutoLayouts(content, vibeId);
  // Slug is only consumed by the Puck editor's AI-rewrite field; render path
  // ignores it, but the type wants a string.
  const puckConfig = buildPuckConfig(slug);

  return (
    <div {...bodyAttrs}>
      <style id="site-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />
      <VibeProvider value={vibeId}>
        <Render config={puckConfig} data={resolvedContent} />
      </VibeProvider>
    </div>
  );
}
