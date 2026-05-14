import "server-only";

const CF_API = "https://api.cloudflare.com/client/v4";

export type CloudflareClient = {
  createPagesProject: (slug: string, repoOwner: string, repoName: string) => Promise<{ subdomain: string }>;
  addPagesDomain: (project: string, fqdn: string) => Promise<void>;
  upsertCname: (name: string, target: string) => Promise<void>;
  getPagesLatestDeployment: (project: string) => Promise<{ url: string; status: string } | null>;
};

type CFResult<T> = { success: boolean; errors?: { message: string }[]; result: T };

async function cf<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CF_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = (await res.json()) as CFResult<T>;
  if (!data.success) {
    const msg = data.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`;
    throw new Error(`Cloudflare API: ${msg}`);
  }
  return data.result;
}

export function createCloudflareClient(opts: {
  accountId: string;
  apiToken: string;
  zoneId: string;
}): CloudflareClient {
  const { accountId, apiToken, zoneId } = opts;

  async function createPagesProject(slug: string, repoOwner: string, repoName: string) {
    const body = {
      name: slug,
      production_branch: "main",
      source: {
        type: "github",
        config: {
          owner: repoOwner,
          repo_name: repoName,
          production_branch: "main",
          pr_comments_enabled: false,
          deployments_enabled: true,
          production_deployment_enabled: true,
        },
      },
      build_config: {
        build_command: "npm run build",
        destination_dir: ".next",
        root_dir: "",
      },
    };
    try {
      const result = await cf<{ subdomain: string }>(
        apiToken,
        `/accounts/${accountId}/pages/projects`,
        { method: "POST", body: JSON.stringify(body) },
      );
      return { subdomain: result.subdomain };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/Git installation|installation_id|not been installed/i.test(msg)) {
        throw new Error(
          "Cloudflare Pages can't reach your GitHub account. Install the Cloudflare " +
            "Pages GitHub App once and grant it access to the new repo: " +
            "https://github.com/apps/cloudflare-pages",
        );
      }
      throw err;
    }
  }

  async function addPagesDomain(project: string, fqdn: string) {
    await cf(apiToken, `/accounts/${accountId}/pages/projects/${project}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: fqdn }),
    });
  }

  async function upsertCname(name: string, target: string) {
    // Find existing record
    const existing = await cf<{ id: string; name: string }[]>(
      apiToken,
      `/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}&type=CNAME`,
    );
    const body = JSON.stringify({
      type: "CNAME",
      name,
      content: target,
      proxied: true,
      ttl: 1,
    });
    if (existing && existing.length > 0) {
      await cf(apiToken, `/zones/${zoneId}/dns_records/${existing[0].id}`, {
        method: "PUT",
        body,
      });
    } else {
      await cf(apiToken, `/zones/${zoneId}/dns_records`, { method: "POST", body });
    }
  }

  async function getPagesLatestDeployment(project: string) {
    try {
      const result = await cf<{ url: string; latest_stage: { status: string } }[]>(
        apiToken,
        `/accounts/${accountId}/pages/projects/${project}/deployments?per_page=1`,
      );
      const d = result?.[0];
      if (!d) return null;
      return { url: d.url, status: d.latest_stage?.status ?? "unknown" };
    } catch {
      return null;
    }
  }

  return { createPagesProject, addPagesDomain, upsertCname, getPagesLatestDeployment };
}
