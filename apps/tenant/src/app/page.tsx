/** Root of the tenants project. End-users never see this — the Pages Worker
 * rewrites every tenant request to /[slug]/... before hitting the static
 * assets. This page only renders when someone visits the bare
 * <project>.pages.dev URL. */
export default function PlatformRoot() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 text-slate-600">
      <p className="text-sm">vibe-cms tenant platform</p>
    </main>
  );
}
