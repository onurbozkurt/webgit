"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRepo } from "@/lib/store";
import { formatRelativeDate } from "@/lib/utils";
import type { CommitEntry } from "@/types/git";

interface ContextMenuState {
    x: number;
    y: number;
    commit: CommitEntry;
}

function CommitContextMenu({
    x,
    y,
    commit,
    onClose,
}: {
    x: number;
    y: number;
    commit: CommitEntry;
    onClose: () => void;
}) {
    const { state, doCherryPick } = useRepo();
    const menuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const [branchSearch, setBranchSearch] = useState("");

    const localBranches = useMemo(
        () => state.branches.filter((b) => !b.isRemote && b.name !== state.currentBranch),
        [state.branches, state.currentBranch]
    );

    const filteredBranches = useMemo(() => {
        if (!branchSearch.trim()) return localBranches;
        const q = branchSearch.toLowerCase();
        return localBranches.filter((b) => b.name.toLowerCase().includes(q));
    }, [localBranches, branchSearch]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [onClose]);

    useEffect(() => {
        if (!menuRef.current) return;
        const rect = menuRef.current.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            menuRef.current.style.top = `${y - rect.height}px`;
        }
        if (rect.right > window.innerWidth) {
            menuRef.current.style.left = `${x - rect.width}px`;
        }
    }, [x, y]);

    useEffect(() => {
        if (localBranches.length > 5) searchRef.current?.focus();
    }, [localBranches.length]);

    const handleCherryPick = async (targetBranch: string) => {
        onClose();
        await doCherryPick(commit.hash, targetBranch);
    };

    const handleCopyHash = async () => {
        onClose();
        await navigator.clipboard.writeText(commit.hash);
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] flex flex-col rounded-lg border shadow-xl py-1 text-sm"
            style={{
                left: `${x}px`,
                top: `${y}px`,
                backgroundColor: "var(--popover)",
                color: "var(--popover-foreground)",
                minWidth: "200px",
                maxWidth: "280px",
            }}
        >
            {localBranches.length > 0 ? (
                <>
                    <div
                        className="px-3 py-1.5 text-xs font-medium uppercase"
                        style={{ color: "var(--muted-foreground)" }}
                    >
                        Cherry-pick to
                    </div>
                    {localBranches.length > 5 && (
                        <div className="px-2 pb-1">
                            <input
                                ref={searchRef}
                                type="text"
                                value={branchSearch}
                                onChange={(e) => setBranchSearch(e.target.value)}
                                placeholder="Filter branches..."
                                className="w-full px-2 py-1 rounded text-xs border outline-none"
                                style={{
                                    backgroundColor: "var(--background)",
                                    borderColor: "var(--border)",
                                    color: "var(--foreground)",
                                }}
                            />
                        </div>
                    )}
                    <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
                        {filteredBranches.length === 0 ? (
                            <div className="px-3 py-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                                No matching branches
                            </div>
                        ) : (
                            filteredBranches.map((branch) => (
                                <button
                                    key={branch.name}
                                    onClick={() => handleCherryPick(branch.name)}
                                    className="w-full text-left px-3 py-1.5 hover-bg transition-colors truncate"
                                >
                                    {branch.name}
                                </button>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <div
                    className="px-3 py-1.5 text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                >
                    No other local branches
                </div>
            )}

            <div className="my-1 border-t" />

            <button
                onClick={handleCopyHash}
                className="text-left px-3 py-1.5 hover-bg transition-colors whitespace-nowrap"
            >
                Copy Commit Hash
            </button>
        </div>
    );
}

export function CommitList() {
    const { state, loadCommitDetail } = useRepo();
    const { commits, selectedCommitEntry } = state;
    const [search, setSearch] = useState("");
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const filtered = useMemo(() => {
        if (!search.trim()) return commits;
        const q = search.toLowerCase();
        return commits.filter(
            (c) =>
                c.message.toLowerCase().includes(q) ||
                c.abbreviatedHash.toLowerCase().includes(q) ||
                c.author.toLowerCase().includes(q)
        );
    }, [commits, search]);

    const handleContextMenu = useCallback((e: React.MouseEvent, commit: CommitEntry) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, commit });
    }, []);

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
        <div className="flex flex-col h-full">
            {/* Search */}
            <div className="px-3 py-2 border-b shrink-0">
                <div className="relative">
                    <svg
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                        style={{ color: "var(--muted-foreground)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search commits..."
                        className="w-full pl-7 pr-2 py-1.5 rounded-md text-sm border outline-none transition-colors"
                        style={{
                            backgroundColor: "var(--background)",
                            borderColor: "var(--border)",
                            color: "var(--foreground)",
                        }}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
            {filtered.length === 0 ? (
                <div className="p-4 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                    No matching commits
                </div>
            ) : filtered.map((commit) => {
                const isSelected = selectedCommitEntry?.hash === commit.hash;
                return (
                    <button
                        key={commit.hash}
                        onClick={() => loadCommitDetail(commit.hash)}
                        onContextMenu={(e) => handleContextMenu(e, commit)}
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

            {contextMenu && (
                <CommitContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    commit={contextMenu.commit}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
}
