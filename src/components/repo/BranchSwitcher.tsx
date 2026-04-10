"use client";

import { useState, useRef, useEffect } from "react";
import { useRepo } from "@/lib/store";
import { formatRelativeDate } from "@/lib/utils";

export function BranchSwitcher() {
    const { state, doCheckout, doCreateBranch, doDeleteBranch, refreshBranches } = useRepo();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newBranchName, setNewBranchName] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        if (open) refreshBranches();
    }, [open, refreshBranches]);

    const localBranches = state.branches.filter((b) => !b.isRemote);
    const remoteBranches = state.branches.filter((b) => b.isRemote);

    const filtered = (branches: typeof state.branches) =>
        branches.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

    const handleCheckout = async (name: string) => {
        setOpen(false);
        await doCheckout(name);
    };

    const handleCreate = async () => {
        if (!newBranchName.trim()) return;
        await doCreateBranch(newBranchName.trim());
        setNewBranchName("");
        setShowCreate(false);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover-bg transition-colors border"
                style={{ borderColor: "var(--border)" }}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium max-w-[200px] truncate">{state.currentBranch || "main"}</span>
                <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div
                    className="absolute top-full left-0 mt-1 w-72 rounded-lg border shadow-xl z-50 overflow-hidden"
                    style={{ backgroundColor: "var(--popover)" }}
                >
                    {/* Search */}
                    <div className="p-2 border-b">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Find a branch..."
                            className="w-full px-3 py-1.5 rounded-md border text-sm outline-none"
                            style={{
                                backgroundColor: "var(--input)",
                                borderColor: "var(--border)",
                                color: "var(--foreground)",
                            }}
                            autoFocus
                        />
                    </div>

                    {/* Create branch */}
                    {showCreate ? (
                        <div className="p-2 border-b">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newBranchName}
                                    onChange={(e) => setNewBranchName(e.target.value)}
                                    placeholder="new-branch-name"
                                    className="flex-1 px-2 py-1 rounded border text-sm outline-none"
                                    style={{
                                        backgroundColor: "var(--input)",
                                        borderColor: "var(--border)",
                                        color: "var(--foreground)",
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreate();
                                        if (e.key === "Escape") setShowCreate(false);
                                    }}
                                    autoFocus
                                />
                                <button
                                    onClick={handleCreate}
                                    className="px-2 py-1 rounded text-xs font-medium"
                                    style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="w-full text-left px-3 py-2 text-sm border-b hover-bg flex items-center gap-2"
                            style={{ color: "var(--accent)" }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New branch
                        </button>
                    )}

                    {/* Branch list */}
                    <div className="max-h-64 overflow-auto">
                        {filtered(localBranches).length > 0 && (
                            <div>
                                <div className="px-3 py-1.5 text-xs font-medium uppercase" style={{ color: "var(--muted-foreground)" }}>
                                    Local
                                </div>
                                {filtered(localBranches).map((branch) => (
                                    <div key={branch.name} className="flex items-center group">
                                        <button
                                            onClick={() => handleCheckout(branch.name)}
                                            className="flex-1 text-left px-3 py-1.5 text-sm hover-bg flex items-center gap-2 min-w-0"
                                        >
                                            {branch.current && (
                                                <svg className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            <span className={`truncate ${branch.current ? "font-medium" : "ml-5.5"}`}>
                                                {branch.name}
                                            </span>
                                            {branch.lastCommitDate && (
                                                <span className="ml-auto text-xs shrink-0" style={{ color: "var(--muted-foreground)" }}>
                                                    {formatRelativeDate(branch.lastCommitDate)}
                                                </span>
                                            )}
                                        </button>
                                        {!branch.current && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    doDeleteBranch(branch.name);
                                                }}
                                                className="px-2 py-1 text-xs opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                                                title="Delete branch"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {filtered(remoteBranches).length > 0 && (
                            <div>
                                <div className="px-3 py-1.5 text-xs font-medium uppercase border-t" style={{ color: "var(--muted-foreground)" }}>
                                    Remote
                                </div>
                                {filtered(remoteBranches).map((branch) => (
                                    <button
                                        key={branch.name}
                                        onClick={() => handleCheckout(branch.name)}
                                        className="w-full text-left px-3 py-1.5 text-sm hover-bg flex items-center gap-2"
                                        style={{ color: "var(--muted-foreground)" }}
                                    >
                                        <span className="ml-5.5 truncate">{branch.name}</span>
                                        {branch.lastCommitDate && (
                                            <span className="ml-auto text-xs shrink-0">
                                                {formatRelativeDate(branch.lastCommitDate)}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
