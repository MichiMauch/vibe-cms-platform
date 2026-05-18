import "server-only";

const CF_API = "https://api.cloudflare.com/client/v4";

export type CloudflareClient = {
  /** Create or update a CNAME record in the configured zone. */
  upsertCname: (name: string, target: string) => Promise<void>;
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
  apiToken: string;
  zoneId: string;
}): CloudflareClient {
  const { apiToken, zoneId } = opts;

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

  return { upsertCname };
}
