import type { PageEntry } from "./types";
import { pageTitleFor } from "./types";

type Props = {
  brand: string;
  pages: PageEntry[];
  locale: string;
  /** Active page path, "" for homepage. Used for active-state highlighting. */
  activePath: string;
  /** Base path prefix in front of every link. The tenant uses `/<locale>`. */
  basePath: string;
};

type NavNode = PageEntry & { children: PageEntry[] };

function buildTree(pages: PageEntry[]): NavNode[] {
  const visible = pages.filter((p) => p.showInNav !== false);
  const ordered = [...visible].sort(
    (a, b) => (a.navOrder ?? 0) - (b.navOrder ?? 0) || a.path.localeCompare(b.path),
  );
  const byPath = new Map<string, NavNode>();
  for (const p of ordered) byPath.set(p.path, { ...p, children: [] });
  const roots: NavNode[] = [];
  for (const node of byPath.values()) {
    if (node.parent && byPath.has(node.parent)) {
      byPath.get(node.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function hrefFor(basePath: string, path: string): string {
  const cleanBase = basePath.replace(/\/+$/, "");
  if (!path) return `${cleanBase}/`;
  return `${cleanBase}/${path}`;
}

export function SiteHeader({ brand, pages, locale, activePath, basePath }: Props) {
  const tree = buildTree(pages);
  if (tree.length === 0) return null;

  const home = pages.find((p) => p.path === "");
  const homeHref = hrefFor(basePath, "");

  return (
    <header className="site-header" role="banner">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.site-header { position:sticky; top:0; z-index:40; background:var(--vibe-bg, #fff); border-bottom:1px solid var(--vibe-border, #e2e8f0); }
.site-header-inner { max-width:1200px; margin:0 auto; padding:0.75rem 1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1.5rem; }
.site-header-brand { font-weight:700; font-size:1.05rem; color:var(--vibe-ink, #0f172a); text-decoration:none; }
.site-header-nav { display:flex; gap:0.25rem; align-items:center; flex-wrap:wrap; }
.site-header-link { position:relative; padding:0.5rem 0.85rem; border-radius:0.5rem; font-size:0.875rem; color:var(--vibe-ink-muted, #475569); text-decoration:none; transition:background 120ms, color 120ms; }
.site-header-link:hover { background:var(--vibe-surface, #f8fafc); color:var(--vibe-ink, #0f172a); }
.site-header-link[aria-current="page"] { color:var(--vibe-accent, #2563eb); font-weight:600; }
.site-header-group { position:relative; }
.site-header-group:hover > .site-header-submenu { display:flex; }
.site-header-submenu { display:none; position:absolute; top:100%; left:0; flex-direction:column; min-width:14rem; background:var(--vibe-bg, #fff); border:1px solid var(--vibe-border, #e2e8f0); border-radius:0.5rem; padding:0.35rem; margin-top:0.25rem; box-shadow:0 10px 30px rgba(15,23,42,0.08); }
.site-header-submenu .site-header-link { white-space:nowrap; }
@media (max-width:640px) {
  .site-header-inner { flex-direction:column; align-items:flex-start; gap:0.5rem; }
  .site-header-submenu { position:static; display:flex; box-shadow:none; padding:0 0 0 1rem; border:0; }
}
        `,
        }}
      />
      <div className="site-header-inner">
        <a href={homeHref} className="site-header-brand">
          {home ? pageTitleFor(home, locale) : brand}
        </a>
        <nav className="site-header-nav" aria-label="Hauptnavigation">
          {tree.map((node) => {
            const hasChildren = node.children.length > 0;
            const isActive = activePath === node.path;
            const href = hrefFor(basePath, node.path);
            if (!hasChildren) {
              return (
                <a
                  key={node.path}
                  href={href}
                  className="site-header-link"
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageTitleFor(node, locale)}
                </a>
              );
            }
            const childActive = node.children.some((c) => c.path === activePath);
            return (
              <div key={node.path} className="site-header-group">
                <a
                  href={href}
                  className="site-header-link"
                  aria-current={isActive || childActive ? "page" : undefined}
                >
                  {pageTitleFor(node, locale)}
                </a>
                <div className="site-header-submenu" role="menu">
                  {node.children.map((child) => (
                    <a
                      key={child.path}
                      href={hrefFor(basePath, child.path)}
                      className="site-header-link"
                      aria-current={activePath === child.path ? "page" : undefined}
                    >
                      {pageTitleFor(child, locale)}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
