import "server-only";

export type PlatformEnv = {
  github: {
    token: string;
    owner: string;
    templateRepo: string;
  };
  cloudflare: {
    accountId: string;
    apiToken: string;
    zoneId: string;
    rootDomain: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
};

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    throw new Error(`Missing env: ${name}. Set it in .env.local.`);
  }
  return v.trim();
}

export function readEnv(): PlatformEnv {
  return {
    github: {
      token: required("GITHUB_TOKEN"),
      owner: required("GITHUB_OWNER"),
      templateRepo: required("GITHUB_TEMPLATE_REPO"),
    },
    cloudflare: {
      accountId: required("CLOUDFLARE_ACCOUNT_ID"),
      apiToken: required("CLOUDFLARE_API_TOKEN"),
      zoneId: required("CLOUDFLARE_ZONE_ID"),
      rootDomain: required("CLOUDFLARE_ROOT_DOMAIN"),
    },
    openai: {
      apiKey: required("OPENAI_API_KEY"),
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    },
  };
}
