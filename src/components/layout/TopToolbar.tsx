"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRepo } from "@/lib/store";
import { BranchSwitcher } from "@/components/repo/BranchSwitcher";

export function TopToolbar() {
    const router = useRouter();
    const { state, refreshStatus, doFetch, doPush, doPull } = useRepo();
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleAction = async (action: string, fn: () => Promise<void>) => {
        setActionLoading(action);
        try {
            await fn();
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <header
            className="h-14 border-b flex items-center px-4 gap-4 shrink-0"
            style={{ backgroundColor: "var(--card)" }}
        >
            {/* Repo name */}
            <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover-bg transition-colors"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">{state.repoName}</span>
            </button>

            <div className="w-px h-6" style={{ backgroundColor: "var(--border)" }} />

            {/* Branch switcher */}
            <BranchSwitcher />

            {/* Refresh status */}
            <button
                onClick={() => handleAction("status", refreshStatus)}
                disabled={actionLoading !== null}
                className="px-2 py-1.5 rounded-md text-sm hover-bg transition-colors disabled:opacity-50"
                style={{ color: "var(--muted-foreground)" }}
                title="Refresh Status"
            >
                {actionLoading === "status" ? (
                    <Spinner />
                ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                )}
            </button>

            <div className="flex-1" />

            {/* Ahead/Behind indicators */}
            {(state.ahead > 0 || state.behind > 0) && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {state.ahead > 0 && (
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            {state.ahead}
                        </span>
                    )}
                    {state.behind > 0 && (
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            {state.behind}
                        </span>
                    )}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => handleAction("fetch", doFetch)}
                    disabled={actionLoading !== null}
                    className="px-3 py-1.5 rounded-md text-sm border hover-bg transition-colors disabled:opacity-50"
                    style={{ borderColor: "var(--border)" }}
                    title="Fetch"
                >
                    {actionLoading === "fetch" ? (
                        <Spinner />
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={() => handleAction("pull", doPull)}
                    disabled={actionLoading !== null}
                    className="px-3 py-1.5 rounded-md text-sm border hover-bg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    style={{ borderColor: "var(--border)" }}
                >
                    {actionLoading === "pull" ? <Spinner /> : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    )}
                    <span>Pull</span>
                </button>

                <button
                    onClick={() => handleAction("push", doPush)}
                    disabled={actionLoading !== null}
                    className="px-3 py-1.5 rounded-md text-sm font-medium rounded-md flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                    style={{
                        backgroundColor: "var(--primary)",
                        color: "var(--primary-foreground)",
                    }}
                >
                    {actionLoading === "push" ? <Spinner /> : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    )}
                    <span>Push</span>
                </button>
            </div>
        </header>
    );
}

function Spinner() {
    return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}
