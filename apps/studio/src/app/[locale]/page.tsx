import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readContent } from "@vibe-cms-platform/core/lib/server";
import { localeExists } from "@vibe-cms-platform/core/i18n/server";
import { BlockRenderer } from "@vibe-cms-platform/core/renderer";
import { BlockManager } from "@vibe-cms-platform/core/manager";

export const dynamic = "force-dynamic";

const FALLBACK = {
  title: "Vibe-CMS",
  description: "Bearbeite deine Seite direkt im Browser. Kein Backend, keine Datenbank.",
};

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  if (!(await localeExists(locale))) return {};

  const { seo } = await readContent(locale);
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

export default async function Home({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  if (!(await localeExists(locale))) notFound();

  const content = await readContent(locale);
  return (
    <>
      <BlockRenderer sections={content.sections} />
      <BlockManager sections={content.sections} locale={locale} />
    </>
  );
}
