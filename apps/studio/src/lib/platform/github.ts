import "server-only";
import { Octokit } from "octokit";

export type GitHubClient = {
  /** Commit a single text file. Auto-detects whether the file already exists
   * (via SHA fetch) and updates or creates accordingly. Retries through the
   * common race where the SHA is stale.
   */
  putFile: (filePath: string, content: string, commitMessage: string) => Promise<void>;
  /** Same as putFile but accepts already-base64-encoded content. */
  putBase64File: (filePath: string, base64: string, commitMessage: string) => Promise<void>;
};

export function createGitHubClient(opts: {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}): GitHubClient {
  const octokit = new Octokit({ auth: opts.token });
  const owner = opts.owner;
  const repo = opts.repo;
  const branch = opts.branch ?? "main";

  async function getFileSha(filePath: string): Promise<string | undefined> {
    try {
      const res = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner,
        repo,
        path: filePath,
        ref: branch,
      });
      if (Array.isArray(res.data)) return undefined;
      return res.data.sha;
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 404) return undefined;
      throw err;
    }
  }

  async function putBase64File(filePath: string, base64: string, commitMessage: string) {
    let sha = await getFileSha(filePath);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
          owner,
          repo,
          path: filePath,
          message: commitMessage,
          content: base64,
          sha,
          branch,
        });
        return;
      } catch (err) {
        const status = (err as { status?: number })?.status;
        const message = (err as { message?: string })?.message || "";
        if ((status === 409 || status === 422) && /sha/.test(message) && attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500));
          sha = await getFileSha(filePath);
          continue;
        }
        throw err;
      }
    }
  }

  async function putFile(filePath: string, content: string, commitMessage: string) {
    const base64 = Buffer.from(content, "utf-8").toString("base64");
    await putBase64File(filePath, base64, commitMessage);
  }

  return { putFile, putBase64File };
}
