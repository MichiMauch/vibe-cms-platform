import "server-only";

export type PlatformEnv = {
  github: {
    token: string;
    owner: string;
    repo: string;
    branch: string;
  };
  cloudflare: {
    apiToken: string;
    zoneId: string;
    rootDomain: string;
    /** Hostname tenant subdomains CNAME to (e.g. "studio.mauch.rocks"). */
    tenantHost: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  auth: {
    jwtSecret: string;
    publicUrl: string;
    masterEmails: string[];
  };
  resend: {
    apiKey: string;
    fromEmail: string;
  };
  /** Optional — when all three are present, site-create attaches the new
   * subdomain to the Studio Coolify app and triggers a redeploy. */
  coolify: {
    apiUrl: string;
    apiToken: string;
    appUuid: string;
  } | null;
};

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    throw new Error(`Missing env: ${name}. Set it in .env.local.`);
  }
  return v.trim();
}

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

export function readEnv(): PlatformEnv {
  return {
    github: {
      token: required("GITHUB_TOKEN"),
      owner: required("GITHUB_OWNER"),
      repo: optional("GITHUB_REPO", "vibe-cms-platform"),
      branch: optional("GITHUB_BRANCH", "main"),
    },
    cloudflare: {
      apiToken: required("CLOUDFLARE_API_TOKEN"),
      zoneId: required("CLOUDFLARE_ZONE_ID"),
      rootDomain: required("CLOUDFLARE_ROOT_DOMAIN"),
      tenantHost: optional("STUDIO_HOST", "studio.mauch.rocks"),
    },
    openai: {
      apiKey: required("OPENAI_API_KEY"),
      model: optional("OPENAI_MODEL", "gpt-4o-mini"),
    },
    auth: {
      jwtSecret: required("JWT_SECRET"),
      publicUrl: required("PUBLIC_URL"),
      masterEmails: required("MASTER_EMAILS")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    },
    resend: {
      apiKey: required("RESEND_API_KEY"),
      fromEmail: required("RESEND_FROM_EMAIL"),
    },
    coolify: readCoolify(),
  };
}

function readCoolify(): PlatformEnv["coolify"] {
  const apiUrl = process.env.COOLIFY_API_URL?.trim();
  const apiToken = process.env.COOLIFY_API_TOKEN?.trim();
  const appUuid = process.env.COOLIFY_STUDIO_APP_UUID?.trim();
  if (!apiUrl || !apiToken || !appUuid) return null;
  return { apiUrl, apiToken, appUuid };
}
