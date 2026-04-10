"use client";

import { useState } from "react";
import { useRepo } from "@/lib/store";
import { DiffViewer } from "@/components/diff/DiffViewer";

export function CommitDetails() {
    const { state } = useRepo();
    const { selectedCommitEntry, commitDiff, commitStats } = state;
    const [hashCopied, setHashCopied] = useState(false);

    if (!selectedCommitEntry || !commitDiff) return null;

    const copyHash = async () => {
        await navigator.clipboard.writeText(selectedCommitEntry.hash);
        setHashCopied(true);
        setTimeout(() => setHashCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Commit header */}
            <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ backgroundColor: "var(--card)" }}>
                {/* Title */}
                <h2 className="text-base font-semibold leading-snug">
                    {selectedCommitEntry.message}
                </h2>

                {selectedCommitEntry.body && (
                    <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: "var(--muted-foreground)" }}>
                        {selectedCommitEntry.body}
                    </p>
                )}

                {/* Author line */}
                <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm font-medium">
                        {selectedCommitEntry.author}
                    </span>
                    {selectedCommitEntry.email && (
                        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                            &lt;{selectedCommitEntry.email}&gt;
                        </span>
                    )}
                </div>

                {/* Hash + copy */}
                <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5">
                        {/* Commit icon */}
                        <svg className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="12" cy="12" r="3" strokeWidth={2} />
                            <path strokeLinecap="round" strokeWidth={2} d="M12 2v7m0 6v7" />
                        </svg>
                        <code className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            {selectedCommitEntry.hash}
                        </code>
                        <button
                            onClick={copyHash}
                            className="p-0.5 rounded hover-bg transition-colors"
                            title="Copy full SHA"
                        >
                            {hashCopied ? (
                                <svg className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth={2} />
                                    <path strokeWidth={2} d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {commitStats && (commitStats.additions > 0 || commitStats.deletions > 0) && (
                    <div className="flex items-center gap-3 mt-2 text-xs">
                        <svg className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {commitStats.additions > 0 && (
                            <span style={{ color: "var(--primary)" }}>
                                {commitStats.additions.toLocaleString()} added line{commitStats.additions !== 1 ? "s" : ""}
                            </span>
                        )}
                        {commitStats.deletions > 0 && (
                            <span style={{ color: "var(--destructive)" }}>
                                {commitStats.deletions.toLocaleString()} removed line{commitStats.deletions !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Diff */}
            <div className="flex-1 overflow-auto">
                <DiffViewer diff={commitDiff} fileName="" />
            </div>
        </div>
    );
}
