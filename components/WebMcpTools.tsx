"use client";

import { useEffect } from "react";
import { buildWebMcpTools } from "@/lib/webmcp";

interface ModelContextLike {
  registerTool?: (tool: unknown, options?: unknown) => unknown;
  unregisterTool?: (name: string) => void;
}

/**
 * The WebMCP draft moved the entry point from navigator.modelContext to document.modelContext
 * (Chrome deprecated the old name, then removed it). Prefer the new location, fall back to the old one.
 */
function getModelContext(): ModelContextLike | undefined {
  const fromDocument = (document as unknown as { modelContext?: ModelContextLike }).modelContext;
  const fromNavigator = (navigator as unknown as { modelContext?: ModelContextLike }).modelContext;
  return fromDocument ?? fromNavigator;
}

/**
 * Registers read-only WebMCP tools when the browser exposes document.modelContext (or the older navigator.modelContext).
 * No-op everywhere else (the API is an early preview), so it cannot affect normal visitors.
 */
export default function WebMcpTools(): null {
  useEffect(() => {
    const ctx = getModelContext();
    if (!ctx || typeof ctx.registerTool !== "function") return;

    const tools = buildWebMcpTools(window.location.origin);
    const registered: string[] = [];
    // Newer drafts unregister via an AbortSignal; older ones via unregisterTool(name). Support both.
    const abort = new AbortController();
    for (const tool of tools) {
      try {
        ctx.registerTool({ ...tool, signal: abort.signal });
        registered.push(tool.name);
      } catch {
        // Spec is still changing (name/shape); a failed registration must never break the page.
      }
    }
    return () => {
      abort.abort();
      for (const name of registered) {
        try {
          ctx.unregisterTool?.(name);
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  return null;
}
