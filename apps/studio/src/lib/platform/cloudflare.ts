import "server-only";

const CF_API = "https://api.cloudflare.com/client/v4";

export type CloudflareClient = {
  /** Create or update a CNAME record in the configured zone. */
  upsertCname: (name: string, target: string) => Promise<void>;
  /** Remove a CNAME record by name. No-op if it doesn't exist. */
  deleteCname: (name: string) => Promise<void>;
  /** Attach a custom domain to the Pages project (idempotent — "already
   * exists" errors are swallowed by the caller). */
  addPagesDomain: (project: string, fqdn: string) => Promise<void>;
  /** Detach a custom domain from the Pages project. No-op if missing. */
  removePagesDomain: (project: string, fqdn: string) => Promise<void>;
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

  async function upsertCname(name: string, target: string) {
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

  async function deleteCname(name: string) {
    const existing = await cf<{ id: string; name: string }[]>(
      apiToken,
      `/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}&type=CNAME`,
    );
    if (!existing || existing.length === 0) return;
    for (const rec of existing) {
      try {
        await cf(apiToken, `/zones/${zoneId}/dns_records/${rec.id}`, { method: "DELETE" });
      } catch (err) {
        if (!/not found|already/i.test(err instanceof Error ? err.message : "")) throw err;
      }
    }
  }

  async function addPagesDomain(project: string, fqdn: string) {
    await cf(apiToken, `/accounts/${accountId}/pages/projects/${project}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: fqdn }),
    });
  }

  async function removePagesDomain(project: string, fqdn: string) {
    try {
      await cf(apiToken, `/accounts/${accountId}/pages/projects/${project}/domains/${encodeURIComponent(fqdn)}`, {
        method: "DELETE",
      });
    } catch (err) {
      // 404 = already gone, perfectly fine
      if (!/not found|does not exist|404/i.test(err instanceof Error ? err.message : "")) throw err;
    }
  }

  return { upsertCname, deleteCname, addPagesDomain, removePagesDomain };
}
