"use client";

import { createContext, useContext, useMemo } from "react";

export type EditScope = {
  /** Tenant slug — when set, included in every save body so the API can route
   * to the right site. Leave undefined for legacy single-tenant mode.
   */
  slug?: string;
  /** Override the save endpoint. Defaults to /api/save-content for legacy
   * mode; pass /api/content/save for the multi-tenant editor.
   */
  saveEndpoint?: string;
  /** Override the AI-rewrite endpoint. Defaults to /api/ai-rewrite. */
  aiRewriteEndpoint?: string;
};

const Ctx = createContext<EditScope>({});

export function EditScopeProvider({
  value,
  children,
}: {
  value: EditScope;
  children: React.ReactNode;
}) {
  const memo = useMemo(() => value, [value.slug, value.saveEndpoint, value.aiRewriteEndpoint]);
  return <Ctx.Provider value={memo}>{children}</Ctx.Provider>;
}

export function useEditScope(): EditScope {
  return useContext(Ctx);
}

/** Build a save fetch with the active scope merged in. Always returns a Promise<Response>. */
export function useSaveContent() {
  const scope = useEditScope();
  return async function save(body: {
    path: string;
    value: unknown;
    locale: string;
    propagate?: boolean;
  }): Promise<Response> {
    const url = scope.saveEndpoint ?? "/api/save-content";
    const fullBody = scope.slug ? { ...body, slug: scope.slug } : body;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullBody),
    });
  };
}

/** Same idea for AI rewrite. */
export function useAIRewrite() {
  const scope = useEditScope();
  return async function rewrite(body: {
    path: string;
    action: string;
    locale: string;
    text: string;
  }): Promise<Response> {
    const url = scope.aiRewriteEndpoint ?? "/api/ai-rewrite";
    const fullBody = scope.slug ? { ...body, slug: scope.slug } : body;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullBody),
    });
  };
}
