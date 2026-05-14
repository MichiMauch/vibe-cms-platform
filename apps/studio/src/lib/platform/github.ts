import "server-only";
import { Octokit } from "octokit";

export type GitHubClient = {
  createFromTemplate: (slug: string, description: string) => Promise<{ repo: string; htmlUrl: string }>;
  putFile: (repo: string, filePath: string, content: string, commitMessage: string) => Promise<void>;
  putBase64File: (repo: string, filePath: string, base64: string, commitMessage: string) => Promise<void>;
  setRepoSecret: (repo: string, name: string, value: string) => Promise<void>;
};

export function createGitHubClient(opts: {
  token: string;
  owner: string;
  templateRepo: string;
}): GitHubClient {
  const octokit = new Octokit({ auth: opts.token });
  const owner = opts.owner;

  async function createFromTemplate(slug: string, description: string) {
    const [templateOwner, templateName] = opts.templateRepo.includes("/")
      ? opts.templateRepo.split("/")
      : [owner, opts.templateRepo];
    const res = await octokit.request("POST /repos/{template_owner}/{template_repo}/generate", {
      template_owner: templateOwner,
      template_repo: templateName,
      owner,
      name: slug,
      description,
      private: false,
      include_all_branches: false,
    });
    return { repo: res.data.name, htmlUrl: res.data.html_url };
  }

  async function getFileSha(repo: string, filePath: string): Promise<string | undefined> {
    // Poll: a freshly-generated template repo populates files asynchronously,
    // so the first few GETs may 404 even though the file is on its way in.
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const res = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
          owner,
          repo,
          path: filePath,
        });
        if (Array.isArray(res.data)) return undefined;
        return res.data.sha;
      } catch (err) {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          // File doesn't (yet) exist. Wait and retry; if it never appears we'll
          // treat it as a genuinely new file (sha=undefined) on the last attempt.
          if (attempt < 7) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          return undefined;
        }
        throw err;
      }
    }
    return undefined;
  }

  async function putBase64File(repo: string, filePath: string, base64: string, commitMessage: string) {
    let sha = await getFileSha(repo, filePath);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
          owner,
          repo,
          path: filePath,
          message: commitMessage,
          content: base64,
          sha,
        });
        return;
      } catch (err) {
        const status = (err as { status?: number })?.status;
        const message = (err as { message?: string })?.message || "";
        // GitHub responds 409/422 with "sha wasn't supplied" when the file landed
        // between our GET and PUT. Re-fetch the sha and try again.
        if ((status === 409 || status === 422) && /sha/.test(message) && attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500));
          sha = await getFileSha(repo, filePath);
          continue;
        }
        throw err;
      }
    }
  }

  async function putFile(repo: string, filePath: string, content: string, commitMessage: string) {
    const base64 = Buffer.from(content, "utf-8").toString("base64");
    await putBase64File(repo, filePath, base64, commitMessage);
  }

  async function setRepoSecret(repo: string, name: string, value: string) {
    // Get the repo public key
    const keyRes = await octokit.request("GET /repos/{owner}/{repo}/actions/secrets/public-key", {
      owner,
      repo,
    });
    const { libsodium_wrappers: sodium } = await import("./sodium-shim");
    await sodium.ready;
    const keyBytes = sodium.from_base64(keyRes.data.key, sodium.base64_variants.ORIGINAL);
    const valueBytes = sodium.from_string(value);
    const encrypted = sodium.crypto_box_seal(valueBytes, keyBytes);
    const encryptedValue = sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL);
    await octokit.request("PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}", {
      owner,
      repo,
      secret_name: name,
      encrypted_value: encryptedValue,
      key_id: keyRes.data.key_id,
    });
  }

  return { createFromTemplate, putFile, putBase64File, setRepoSecret };
}
