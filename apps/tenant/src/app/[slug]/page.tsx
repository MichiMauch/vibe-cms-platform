import { getAllSlugs, getDefaultLocale } from "@/lib/sites";

type Params = { slug: string };

export async function generateStaticParams() {
  return getAllSlugs();
}

/** Default-locale entry. Static export can't emit a true HTTP redirect, so
 * we ship a tiny HTML stub with a meta-refresh + JS fallback. The browser
 * never sees this for more than a frame. */
export default async function TenantIndex({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const locale = getDefaultLocale(slug);
  // From the visitor's POV the URL is <slug>.pages.mauch.rocks/<locale>/ —
  // the Pages Worker rewrites that onto /<slug>/<locale>/ internally, so the
  // target here must be the slug-less host-relative path.
  const target = `/${locale}/`;
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(target)});`,
        }}
      />
      <noscript>
        <a href={target}>Weiter zur Seite</a>
      </noscript>
    </>
  );
}
