import "server-only";

export type CoolifyClient = {
  /** Append `https://<fqdn>` to the Studio app's domain list, then redeploy
   * so Traefik picks up the new route and Let's Encrypt issues a cert. */
  attachDomain: (fqdn: string) => Promise<void>;
};

type CoolifyConfig = {
  apiUrl: string;
  apiToken: string;
  appUuid: string;
};

async function call<T>(cfg: CoolifyConfig, path: string, init?: RequestInit): Promise<T> {
  const url = `${cfg.apiUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Coolify ${res.status}: ${text.slice(0, 200) || res.statusText}`);
  }
  return (await res.json()) as T;
}

export function createCoolifyClient(cfg: CoolifyConfig): CoolifyClient {
  async function attachDomain(fqdn: string) {
    const current = await call<{ fqdn: string | null }>(cfg, `/applications/${cfg.appUuid}`);
    const existing = (current.fqdn ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const candidate = `https://${fqdn}`;
    if (existing.includes(candidate)) return;

    const next = [...existing, candidate].join(",");
    await call(cfg, `/applications/${cfg.appUuid}`, {
      method: "PATCH",
      body: JSON.stringify({ domains: next }),
    });
    await call(cfg, `/deploy?uuid=${cfg.appUuid}&force=false`);
  }

  return { attachDomain };
}
