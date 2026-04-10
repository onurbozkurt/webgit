"use client";

import { createContext, useContext, useReducer, useCallback, type ReactNode, type Dispatch } from "react";
import type { FileChange, CommitEntry, BranchInfo } from "@/types/git";
import { repoApi, type StatusResponse } from "./api-client";

export interface RepoState {
    repoId: string;
    repoName: string;
    repoPath: string;
    activeTab: "changes" | "history";
    fileChanges: FileChange[];
    selectedFile: string | null;
    currentDiff: string | null;
    commits: CommitEntry[];
    selectedCommit: string | null;
    commitDiff: string | null;
    selectedCommitEntry: CommitEntry | null;
    commitStats: { additions: number; deletions: number } | null;
    branches: BranchInfo[];
    currentBranch: string;
    ahead: number;
    behind: number;
    loading: Record<string, boolean>;
    error: string | null;
}

type Action =
    | { type: "SET_STATUS"; payload: StatusResponse }
    | { type: "SET_TAB"; payload: "changes" | "history" }
    | { type: "SELECT_FILE"; payload: string | null }
    | { type: "SET_DIFF"; payload: string | null }
    | { type: "SET_COMMITS"; payload: CommitEntry[] }
    | { type: "APPEND_COMMITS"; payload: CommitEntry[] }
    | { type: "SELECT_COMMIT"; payload: { commit: CommitEntry | null; diff: string | null; stats: { additions: number; deletions: number } | null } }
    | { type: "SET_BRANCHES"; payload: BranchInfo[] }
    | { type: "SET_BRANCH"; payload: string }
    | { type: "SET_LOADING"; payload: { key: string; value: boolean } }
    | { type: "SET_ERROR"; payload: string | null };

function reducer(state: RepoState, action: Action): RepoState {
    switch (action.type) {
        case "SET_STATUS":
            return {
                ...state,
                fileChanges: action.payload.files,
                currentBranch: action.payload.branch,
                ahead: action.payload.ahead,
                behind: action.payload.behind,
            };
        case "SET_TAB":
            return { ...state, activeTab: action.payload };
        case "SELECT_FILE":
            return { ...state, selectedFile: action.payload, currentDiff: null };
        case "SET_DIFF":
            return { ...state, currentDiff: action.payload };
        case "SET_COMMITS":
            return { ...state, commits: action.payload };
        case "APPEND_COMMITS":
            return { ...state, commits: [...state.commits, ...action.payload] };
        case "SELECT_COMMIT":
            return {
                ...state,
                selectedCommitEntry: action.payload.commit,
                commitDiff: action.payload.diff,
                commitStats: action.payload.stats,
            };
        case "SET_BRANCHES":
            return { ...state, branches: action.payload };
        case "SET_BRANCH":
            return { ...state, currentBranch: action.payload };
        case "SET_LOADING":
            return {
                ...state,
                loading: { ...state.loading, [action.payload.key]: action.payload.value },
            };
        case "SET_ERROR":
            return { ...state, error: action.payload };
        default:
            return state;
    }
}

interface RepoContextValue {
    state: RepoState;
    dispatch: Dispatch<Action>;
    refreshStatus: () => Promise<void>;
    refreshBranches: () => Promise<void>;
    refreshLog: () => Promise<void>;
    loadFileDiff: (file: string, staged: boolean) => Promise<void>;
    loadCommitDetail: (hash: string) => Promise<void>;
    stageFiles: (files: string[]) => Promise<void>;
    unstageFiles: (files: string[]) => Promise<void>;
    doCommit: (message: string) => Promise<void>;
    doPush: () => Promise<void>;
    doPull: () => Promise<void>;
    doFetch: () => Promise<void>;
    doCheckout: (branch: string) => Promise<void>;
    doCreateBranch: (name: string) => Promise<void>;
    doDeleteBranch: (name: string) => Promise<void>;
    doDiscard: (files: string[]) => Promise<void>;
    doGitignore: (pattern: string) => Promise<void>;
    doCherryPick: (hash: string, targetBranch: string) => Promise<void>;
}

const RepoContext = createContext<RepoContextValue | null>(null);

export function useRepo(): RepoContextValue {
    const ctx = useContext(RepoContext);
    if (!ctx) throw new Error("useRepo must be used within RepoProvider");
    return ctx;
}

function createInitialState(repoId: string, repoName: string, repoPath: string): RepoState {
    return {
        repoId,
        repoName,
        repoPath,
        activeTab: "changes",
        fileChanges: [],
        selectedFile: null,
        currentDiff: null,
        commits: [],
        selectedCommit: null,
        commitDiff: null,
        selectedCommitEntry: null,
        commitStats: null,
        branches: [],
        currentBranch: "",
        ahead: 0,
        behind: 0,
        loading: {},
        error: null,
    };
}

export function RepoProvider({
    repoId,
    repoName,
    repoPath,
    children,
}: {
    repoId: string;
    repoName: string;
    repoPath: string;
    children: ReactNode;
}) {
    const [state, dispatch] = useReducer(reducer, createInitialState(repoId, repoName, repoPath));

    const withLoading = useCallback(
        async (key: string, fn: () => Promise<void>) => {
            dispatch({ type: "SET_LOADING", payload: { key, value: true } });
            dispatch({ type: "SET_ERROR", payload: null });
            try {
                await fn();
            } catch (err: any) {
                dispatch({ type: "SET_ERROR", payload: err.message });
            } finally {
                dispatch({ type: "SET_LOADING", payload: { key, value: false } });
            }
        },
        []
    );

    const refreshStatus = useCallback(async () => {
        await withLoading("status", async () => {
            const status = await repoApi.status(repoId);
            dispatch({ type: "SET_STATUS", payload: status });
        });
    }, [repoId, withLoading]);

    const refreshBranches = useCallback(async () => {
        await withLoading("branches", async () => {
            const branches = await repoApi.branches(repoId);
            dispatch({ type: "SET_BRANCHES", payload: branches });
        });
    }, [repoId, withLoading]);

    const refreshLog = useCallback(async () => {
        await withLoading("log", async () => {
            const commits = await repoApi.log(repoId);
            dispatch({ type: "SET_COMMITS", payload: commits });
        });
    }, [repoId, withLoading]);

    const loadFileDiff = useCallback(
        async (file: string, staged: boolean) => {
            await withLoading("diff", async () => {
                const diff = await repoApi.diff(repoId, file, staged);
                dispatch({ type: "SET_DIFF", payload: diff });
            });
        },
        [repoId, withLoading]
    );

    const loadCommitDetail = useCallback(
        async (hash: string) => {
            await withLoading("commitDetail", async () => {
                const details = await repoApi.commitDetail(repoId, hash);
                dispatch({
                    type: "SELECT_COMMIT",
                    payload: { commit: details.commit, diff: details.diff, stats: details.stats },
                });
            });
        },
        [repoId, withLoading]
    );

    const doStageFiles = useCallback(
        async (files: string[]) => {
            await withLoading("stage", async () => {
                await repoApi.stage(repoId, files);
                await refreshStatus();
            });
        },
        [repoId, withLoading, refreshStatus]
    );

    const doUnstageFiles = useCallback(
        async (files: string[]) => {
            await withLoading("unstage", async () => {
                await repoApi.unstage(repoId, files);
                await refreshStatus();
            });
        },
        [repoId, withLoading, refreshStatus]
    );

    const doCommit = useCallback(
        async (message: string) => {
            await withLoading("commit", async () => {
                await repoApi.commit(repoId, message);
                await refreshStatus();
                await refreshLog();
            });
        },
        [repoId, withLoading, refreshStatus, refreshLog]
    );

    const doPush = useCallback(async () => {
        await withLoading("push", async () => {
            await repoApi.push(repoId);
            await refreshStatus();
        });
    }, [repoId, withLoading, refreshStatus]);

    const doPull = useCallback(async () => {
        await withLoading("pull", async () => {
            await repoApi.pull(repoId);
            await refreshStatus();
            await refreshLog();
        });
    }, [repoId, withLoading, refreshStatus, refreshLog]);

    const doFetch = useCallback(async () => {
        await withLoading("fetch", async () => {
            await repoApi.fetch(repoId);
            await refreshStatus();
        });
    }, [repoId, withLoading, refreshStatus]);

    const doCheckout = useCallback(
        async (branch: string) => {
            await withLoading("checkout", async () => {
                await repoApi.checkout(repoId, branch);
                await refreshStatus();
                await refreshLog();
                await refreshBranches();
            });
        },
        [repoId, withLoading, refreshStatus, refreshLog, refreshBranches]
    );

    const doCreateBranch = useCallback(
        async (name: string) => {
            await withLoading("createBranch", async () => {
                await repoApi.createBranch(repoId, name);
                await refreshStatus();
                await refreshBranches();
            });
        },
        [repoId, withLoading, refreshStatus, refreshBranches]
    );

    const doDeleteBranch = useCallback(
        async (name: string) => {
            await withLoading("deleteBranch", async () => {
                await repoApi.deleteBranch(repoId, name);
                await refreshBranches();
            });
        },
        [repoId, withLoading, refreshBranches]
    );

    const doDiscard = useCallback(
        async (files: string[]) => {
            await withLoading("discard", async () => {
                await repoApi.discard(repoId, files);
                dispatch({ type: "SELECT_FILE", payload: null });
                dispatch({ type: "SET_DIFF", payload: null });
                await refreshStatus();
            });
        },
        [repoId, withLoading, refreshStatus, dispatch]
    );

    const doGitignore = useCallback(
        async (pattern: string) => {
            await withLoading("gitignore", async () => {
                await repoApi.gitignore(repoId, pattern);
                await refreshStatus();
            });
        },
        [repoId, withLoading, refreshStatus]
    );

    const doCherryPick = useCallback(
        async (hash: string, targetBranch: string) => {
            await withLoading("cherryPick", async () => {
                await repoApi.cherryPick(repoId, hash, targetBranch);
                await refreshLog();
            });
        },
        [repoId, withLoading, refreshLog]
    );

    const value: RepoContextValue = {
        state,
        dispatch,
        refreshStatus,
        refreshBranches,
        refreshLog,
        loadFileDiff,
        loadCommitDetail,
        stageFiles: doStageFiles,
        unstageFiles: doUnstageFiles,
        doCommit,
        doPush,
        doPull,
        doFetch,
        doCheckout,
        doCreateBranch,
        doDeleteBranch,
        doDiscard,
        doGitignore,
        doCherryPick,
    };

    return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}
