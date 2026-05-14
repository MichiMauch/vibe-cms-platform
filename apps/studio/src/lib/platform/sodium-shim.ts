import "server-only";
// Indirection so we can swap libsodium-wrappers for a Node-native alternative
// without leaking the import path through the rest of the codebase. If the
// dependency is missing we throw a friendly error pointing the user at the
// install command.
export const libsodium_wrappers = await (async () => {
  try {
    // @ts-expect-error optional dependency, installed by Studio when secrets are needed
    return await import("libsodium-wrappers");
  } catch {
    throw new Error(
      "Setting GitHub Actions secrets requires libsodium-wrappers. " +
        "Run `npm install libsodium-wrappers --workspace=apps/studio` and re-deploy.",
    );
  }
})();
