"use client";

import { useEffect } from "react";
import { useRepo } from "@/lib/store";
import { TopToolbar } from "@/components/layout/TopToolbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { DiffViewer } from "@/components/diff/DiffViewer";
import { CommitDetails } from "@/components/repo/CommitDetails";

export function RepoWorkspace() {
    const { state, refreshStatus, refreshBranches, refreshLog, doFetch } = useRepo();

    useEffect(() => {
        const init = async () => {
            await doFetch().catch(() => {});
            await Promise.all([refreshStatus(), refreshBranches(), refreshLog()]);
        };
        init();
    }, [doFetch, refreshStatus, refreshBranches, refreshLog]);

    return (
        <div className="h-screen flex flex-col">
            <TopToolbar />
            <div className="flex-1 flex overflow-hidden">
                <LeftSidebar />
                <main className="flex-1 overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
                    {state.activeTab === "changes" ? (
                        state.currentDiff ? (
                            <DiffViewer
                                diff={state.currentDiff}
                                fileName={state.selectedFile || ""}
                            />
                        ) : (
                            <div
                                className="h-full flex items-center justify-center"
                                style={{ color: "var(--muted-foreground)" }}
                            >
                                <div className="text-center">
                                    <svg className="mx-auto mb-3 w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-sm">Select a file to view changes</p>
                                </div>
                            </div>
                        )
                    ) : state.commitDiff ? (
                        <CommitDetails />
                    ) : (
                        <div
                            className="h-full flex items-center justify-center"
                            style={{ color: "var(--muted-foreground)" }}
                        >
                            <div className="text-center">
                                <svg className="mx-auto mb-3 w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm">Select a commit to view details</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
