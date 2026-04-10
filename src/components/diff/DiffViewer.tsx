"use client";

import { useMemo, useState } from "react";
import { html, parse } from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";

interface DiffViewerProps {
    diff: string;
    fileName?: string;
}

export function DiffViewer({ diff, fileName }: DiffViewerProps) {
    const [viewMode, setViewMode] = useState<"line-by-line" | "side-by-side">("line-by-line");

    const diffHtml = useMemo(() => {
        if (!diff) return "";
        try {
            const parsed = parse(diff);
            return html(parsed, {
                drawFileList: false,
                outputFormat: viewMode,
                matching: "lines",
            });
        } catch {
            return `<pre style="padding: 16px; color: var(--foreground);">${diff}</pre>`;
        }
    }, [diff, viewMode]);

    if (!diff) {
        return (
            <div className="h-full flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
                <p className="text-sm">No diff to display</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-2 border-b shrink-0"
                style={{ backgroundColor: "var(--card)" }}
            >
                <div className="flex items-center gap-2">
                    {fileName && (
                        <span className="text-sm font-mono" style={{ color: "var(--muted-foreground)" }}>
                            {fileName}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setViewMode("line-by-line")}
                        className="px-2 py-1 rounded text-xs transition-colors"
                        style={{
                            backgroundColor: viewMode === "line-by-line" ? "var(--secondary)" : "transparent",
                            color: viewMode === "line-by-line" ? "var(--foreground)" : "var(--muted-foreground)",
                        }}
                    >
                        Unified
                    </button>
                    <button
                        onClick={() => setViewMode("side-by-side")}
                        className="px-2 py-1 rounded text-xs transition-colors"
                        style={{
                            backgroundColor: viewMode === "side-by-side" ? "var(--secondary)" : "transparent",
                            color: viewMode === "side-by-side" ? "var(--foreground)" : "var(--muted-foreground)",
                        }}
                    >
                        Split
                    </button>
                </div>
            </div>

            {/* Diff content */}
            <div
                className="flex-1 overflow-auto"
                dangerouslySetInnerHTML={{ __html: diffHtml }}
            />
        </div>
    );
}
