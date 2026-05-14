import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/blocks/index.ts",
    "src/manager/index.ts",
    "src/renderer/index.ts",
    "src/editors/index.ts",
    "src/components/index.ts",
    "src/components/chatbot/index.ts",
    "src/components/seo/index.ts",
    "src/lib/index.ts",
    "src/lib/server.ts",
    "src/api/index.ts",
    "src/api/save-content.ts",
    "src/api/ai-rewrite.ts",
    "src/api/chat.ts",
    "src/api/add-language.ts",
    "src/i18n/index.ts",
    "src/i18n/server.ts",
    "src/types/index.ts",
  ],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: false,
  // bundle: false keeps per-file "use client" directives intact.
  bundle: false,
  // emit .js (not .mjs) to match the exports map
  outExtension() {
    return { js: ".js" };
  },
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "next",
    "next/navigation",
    "next/headers",
    "next/server",
    "next/link",
    "next/image",
    "openai",
    "server-only",
  ],
  // Preserve directives like "use client" / "use server"
  esbuildOptions(options) {
    options.banner = undefined;
    options.legalComments = "inline";
    options.keepNames = true;
  },
});
