import "server-only";
import { Octokit } from "octokit";

export type PutFile = {
  /** Repo-relative path, e.g. "sites/netnode/messages/de.json" */
  path: string;
  content: string;
};

export type GitHubClient = {
  /** Commit a single text file. Auto-detects whether the file already exists
   * (via SHA fetch) and updates or creates accordingly. Retries through the
   * common race where the SHA is stale.
   */
  putFile: (filePath: string, content: string, commitMessage: string) => Promise<void>;
  /** Same as putFile but accepts already-base64-encoded content. */
  putBase64File: (filePath: string, base64: string, commitMessage: string) => Promise<void>;
  /** Commit multiple files in ONE commit via the Git Data API
   * (createTree + createCommit + updateRef). Returns the new commit SHA. */
  putFiles: (files: PutFile[], commitMessage: string) => Promise<string>;
  /** Delete every file under a directory in one commit. Returns the new
   * commit SHA, or null when the directory was already empty / missing. */
  deleteDir: (dirPath: string, commitMessage: string) => Promise<string | null>;
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

  async function putFiles(files: PutFile[], commitMessage: string): Promise<string> {
    if (files.length === 0) throw new Error("putFiles: empty files array");

    // 1. Resolve current branch HEAD commit + base tree.
    const refRes = await octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", {
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const parentSha = refRes.data.object.sha;

    const parentCommit = await octokit.request("GET /repos/{owner}/{repo}/git/commits/{commit_sha}", {
      owner,
      repo,
      commit_sha: parentSha,
    });
    const baseTreeSha = parentCommit.data.tree.sha;

    // 2. Upload each file as a blob, collect tree entries.
    const treeEntries: Array<{
      path: string;
      mode: "100644";
      type: "blob";
      sha: string;
    }> = [];
    for (const f of files) {
      const blob = await octokit.request("POST /repos/{owner}/{repo}/git/blobs", {
        owner,
        repo,
        content: Buffer.from(f.content, "utf-8").toString("base64"),
        encoding: "base64",
      });
      treeEntries.push({
        path: f.path,
        mode: "100644",
        type: "blob",
        sha: blob.data.sha,
      });
    }

    // 3. Create a new tree based on the parent tree.
    const tree = await octokit.request("POST /repos/{owner}/{repo}/git/trees", {
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: treeEntries,
    });

    // 4. Create the commit.
    const commit = await octokit.request("POST /repos/{owner}/{repo}/git/commits", {
      owner,
      repo,
      message: commitMessage,
      tree: tree.data.sha,
      parents: [parentSha],
    });

    // 5. Fast-forward the branch ref.
    await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.data.sha,
    });

    return commit.data.sha;
  }

  async function deleteDir(dirPath: string, commitMessage: string): Promise<string | null> {
    // 1. List the dir (returns the contents at HEAD).
    const trimmed = dirPath.replace(/^\/+|\/+$/g, "");
    if (!trimmed) throw new Error("deleteDir: refusing to delete repo root");

    let entries: Array<{ path: string; type: string }>;
    try {
      const listing = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner,
        repo,
        path: trimmed,
        ref: branch,
      });
      if (!Array.isArray(listing.data)) {
        // single file at this path — treat as a 1-entry directory
        entries = [{ path: listing.data.path, type: listing.data.type }];
      } else {
        entries = listing.data.map((e) => ({ path: e.path, type: e.type }));
      }
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 404) return null;
      throw err;
    }

    // 2. Recursively gather all blob paths under dir.
    const blobPaths: string[] = [];
    async function walk(p: string) {
      const res = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner,
        repo,
        path: p,
        ref: branch,
      });
      if (Array.isArray(res.data)) {
        for (const e of res.data) {
          if (e.type === "dir") await walk(e.path);
          else if (e.type === "file") blobPaths.push(e.path);
        }
      } else if (res.data.type === "file") {
        blobPaths.push(res.data.path);
      }
    }
    for (const e of entries) {
      if (e.type === "dir") await walk(e.path);
      else if (e.type === "file") blobPaths.push(e.path);
    }
    if (blobPaths.length === 0) return null;

    // 3. Build a tree that marks each blob with sha:null (= deletion).
    const refRes = await octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", {
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const parentSha = refRes.data.object.sha;
    const parentCommit = await octokit.request("GET /repos/{owner}/{repo}/git/commits/{commit_sha}", {
      owner,
      repo,
      commit_sha: parentSha,
    });
    const baseTreeSha = parentCommit.data.tree.sha;

    const tree = await octokit.request("POST /repos/{owner}/{repo}/git/trees", {
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: blobPaths.map((p) => ({
        path: p,
        mode: "100644" as const,
        type: "blob" as const,
        sha: null,
      })),
    });

    const commit = await octokit.request("POST /repos/{owner}/{repo}/git/commits", {
      owner,
      repo,
      message: commitMessage,
      tree: tree.data.sha,
      parents: [parentSha],
    });

    await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.data.sha,
    });

    return commit.data.sha;
  }

  return { putFile, putBase64File, putFiles, deleteDir };
}
