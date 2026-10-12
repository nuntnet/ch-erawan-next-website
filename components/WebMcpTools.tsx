"use client";

import { useEffect } from "react";
import { buildWebMcpTools } from "@/lib/webmcp";

interface ModelContextLike {
  registerTool?: (tool: unknown) => unknown;
  unregisterTool?: (name: string) => void;
}

/**
 * Registers read-only WebMCP tools when the browser exposes navigator.modelContext.
 * No-op everywhere else (the API is an early preview), so it cannot affect normal visitors.
 */
export default function WebMcpTools(): null {
  useEffect(() => {
    const ctx = (navigator as unknown as { modelContext?: ModelContextLike }).modelContext;
    if (!ctx || typeof ctx.registerTool !== "function") return;

    const tools = buildWebMcpTools(window.location.origin);
    const registered: string[] = [];
    for (const tool of tools) {
      try {
        ctx.registerTool(tool);
        registered.push(tool.name);
      } catch {
        // Spec is still changing (name/shape); a failed registration must never break the page.
      }
    }
    return () => {
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
