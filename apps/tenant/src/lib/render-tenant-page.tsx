import type { Metadata } from "next";
import { Render } from "@puckeditor/core/rsc";
import { buildPuckConfig } from "@vibe-cms-platform/core/puck";
import { renderTheme, VibeProvider, resolveAutoLayouts } from "@vibe-cms-platform/core/theme";
import { SiteHeader } from "@vibe-cms-platform/core/site";
import { getSiteData } from "@/lib/sites";

const FALLBACK = {
  title: "Vibe-CMS",
  description: "Eine Multi-Tenant-Landingpage-Plattform.",
};

export function tenantMetadata(slug: string, locale: string, pagePath = ""): Metadata {
  const { content } = getSiteData(slug, locale, pagePath);
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

export function renderTenantPage(slug: string, locale: string, pagePath = "") {
  const { content, config: siteConfig, pages } = getSiteData(slug, locale, pagePath);
  const { themeCss, bodyAttrs } = renderTheme(siteConfig.theme);
  const vibeId = siteConfig.theme?.preset ?? null;
  const resolvedContent = resolveAutoLayouts(content, vibeId);
  const puckConfig = buildPuckConfig(slug);
  const showHeader = pages.length > 1;
  // Tenant URLs after the Pages Worker rewrite are `/<locale>/...`.
  const basePath = `/${locale}`;

  return (
    <div {...bodyAttrs}>
      <style id="site-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />
      <VibeProvider value={vibeId}>
        {showHeader ? (
          <SiteHeader
            brand={siteConfig.brand}
            pages={pages}
            locale={locale}
            activePath={pagePath}
            basePath={basePath}
          />
        ) : null}
        <Render config={puckConfig} data={resolvedContent} />
      </VibeProvider>
    </div>
  );
}
