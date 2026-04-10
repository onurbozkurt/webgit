"use client";

import { useState, useMemo, useEffect } from "react";
import { useRepo } from "@/lib/store";
import { DiffViewer } from "@/components/diff/DiffViewer";
import { parse } from "diff2html";

interface CommitFile {
    path: string;
    oldPath?: string;
    additions: number;
    deletions: number;
    diff: string;
    status: "M" | "A" | "D" | "R";
}

function parseCommitFiles(diff: string): CommitFile[] {
    if (!diff) return [];
    try {
        const parsed = parse(diff);
        const rawParts = diff.split(/(?=^diff --git )/m).filter(s => s.trim());
        return parsed.map((file, i) => {
            const isNew = file.oldName === "/dev/null";
            const isDeleted = file.newName === "/dev/null";
            const isRenamed = !isNew && !isDeleted && file.oldName !== file.newName;

            let status: CommitFile["status"] = "M";
            if (isNew) status = "A";
            else if (isDeleted) status = "D";
            else if (isRenamed) status = "R";

            return {
                path: isDeleted ? file.oldName : file.newName,
                oldPath: isRenamed ? file.oldName : undefined,
                additions: file.addedLines,
                deletions: file.deletedLines,
                diff: rawParts[i] || "",
                status,
            };
        });
    } catch {
        return [];
    }
}

function fileStatusColor(status: string): string {
    switch (status) {
        case "A": return "#3fb950";
        case "D": return "#da3633";
        case "R": return "#1f6feb";
        default: return "#d29922";
    }
}

export function CommitDetails() {
    const { state } = useRepo();
    const { selectedCommitEntry, commitDiff, commitStats } = state;
    const [hashCopied, setHashCopied] = useState(false);
    const [selectedFileIdx, setSelectedFileIdx] = useState<number | null>(null);
    const [filesExpanded, setFilesExpanded] = useState(true);

    const files = useMemo(() => {
        if (!commitDiff) return [];
        return parseCommitFiles(commitDiff);
    }, [commitDiff]);

    // Reset file selection when commit changes
    useEffect(() => {
        setSelectedFileIdx(null);
    }, [selectedCommitEntry?.hash]);

    if (!selectedCommitEntry || !commitDiff) return null;

    const activeDiff = selectedFileIdx !== null ? files[selectedFileIdx]?.diff || "" : commitDiff;
    const activeFileName = selectedFileIdx !== null ? files[selectedFileIdx]?.path || "" : "";

    const copyHash = async () => {
        await navigator.clipboard.writeText(selectedCommitEntry.hash);
        setHashCopied(true);
        setTimeout(() => setHashCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Commit header */}
            <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ backgroundColor: "var(--card)" }}>
                <h2 className="text-base font-semibold leading-snug">
                    {selectedCommitEntry.message}
                </h2>

                {selectedCommitEntry.body && (
                    <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: "var(--muted-foreground)" }}>
                        {selectedCommitEntry.body}
                    </p>
                )}

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

                <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5">
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

            {/* Changed files panel */}
            <div className="border-b shrink-0" style={{ backgroundColor: "var(--card)" }}>
                <button
                    onClick={() => setFilesExpanded(!filesExpanded)}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left hover-bg transition-colors"
                >
                    <svg
                        className={`w-3 h-3 transition-transform ${filesExpanded ? "rotate-90" : ""}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M6 4l8 6-8 6V4z" />
                    </svg>
                    <span className="text-xs font-medium uppercase" style={{ color: "var(--muted-foreground)" }}>
                        Changed Files ({files.length})
                    </span>
                    {selectedFileIdx !== null && (
                        <span
                            onClick={(e) => { e.stopPropagation(); setSelectedFileIdx(null); }}
                            className="ml-auto text-xs cursor-pointer hover:underline"
                            style={{ color: "var(--accent)" }}
                        >
                            Show All
                        </span>
                    )}
                </button>
                {filesExpanded && (
                    <div className="max-h-48 overflow-y-auto">
                        {files.map((file, idx) => {
                            const fileName = file.path.split("/").pop() || file.path;
                            const dirPath = file.path.includes("/")
                                ? file.path.substring(0, file.path.lastIndexOf("/")) + "/"
                                : "";
                            return (
                                <div
                                    key={file.path + idx}
                                    className="flex items-center gap-2 px-4 py-1.5 cursor-pointer hover-bg transition-colors text-sm"
                                    style={{
                                        backgroundColor: selectedFileIdx === idx ? "var(--selection)" : undefined,
                                    }}
                                    onClick={() => setSelectedFileIdx(selectedFileIdx === idx ? null : idx)}
                                >
                                    <span
                                        className="text-xs font-mono font-bold shrink-0 w-4 text-center"
                                        style={{ color: fileStatusColor(file.status) }}
                                    >
                                        {file.status}
                                    </span>
                                    <span className="truncate flex-1 min-w-0">
                                        {dirPath && (
                                            <span style={{ color: "var(--muted-foreground)" }}>{dirPath}</span>
                                        )}
                                        {fileName}
                                    </span>
                                    <span className="text-xs shrink-0 flex gap-1.5">
                                        {file.additions > 0 && (
                                            <span style={{ color: "#3fb950" }}>+{file.additions}</span>
                                        )}
                                        {file.deletions > 0 && (
                                            <span style={{ color: "#da3633" }}>-{file.deletions}</span>
                                        )}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Diff */}
            <div className="flex-1 overflow-auto">
                <DiffViewer diff={activeDiff} fileName={activeFileName} />
            </div>
        </div>
    );
}
