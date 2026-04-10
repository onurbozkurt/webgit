"use client";

import { useRepo } from "@/lib/store";
import { formatRelativeDate } from "@/lib/utils";

export function CommitList() {
    const { state, loadCommitDetail } = useRepo();
    const { commits, selectedCommitEntry } = state;

    if (commits.length === 0) {
        return (
            <div className="flex items-center justify-center h-full" style={{ color: "var(--muted-foreground)" }}>
                <div className="text-center p-4">
                    <svg className="mx-auto mb-2 w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">No commits yet</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {commits.map((commit) => {
                const isSelected = selectedCommitEntry?.hash === commit.hash;
                return (
                    <button
                        key={commit.hash}
                        onClick={() => loadCommitDetail(commit.hash)}
                        className="w-full text-left px-3 py-2.5 border-b hover-bg transition-colors"
                        style={{
                            backgroundColor: isSelected ? "var(--selection)" : undefined,
                        }}
                    >
                        <p className="text-sm truncate">{commit.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                {commit.abbreviatedHash}
                            </span>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                {commit.author}
                            </span>
                            <span className="text-xs ml-auto" style={{ color: "var(--muted-foreground)" }}>
                                {formatRelativeDate(commit.date)}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
