import "server-only";

export type PlatformEnv = {
  github: {
    token: string;
    owner: string;
    repo: string;
    branch: string;
  };
  cloudflare: {
    accountId: string;
    apiToken: string;
    zoneId: string;
    rootDomain: string;
    /** Pages project that hosts tenant sites — tenant subdomains CNAME to
     * `<projectName>.pages.dev`, and custom domains attach to this project. */
    projectName: string;
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
      accountId: required("CLOUDFLARE_ACCOUNT_ID"),
      apiToken: required("CLOUDFLARE_API_TOKEN"),
      zoneId: required("CLOUDFLARE_ZONE_ID"),
      rootDomain: required("CLOUDFLARE_ROOT_DOMAIN"),
      projectName: required("CLOUDFLARE_PAGES_PROJECT"),
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
  };
}
