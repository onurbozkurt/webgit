import type { RepoInfo, FileChange, CommitEntry, BranchInfo, ApiResponse } from "@/types/git";

async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(path);
    const json: ApiResponse<T> = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data as T;
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });
    const json: ApiResponse<T> = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data as T;
}

async function apiDelete<T>(path: string): Promise<T> {
    const res = await fetch(path, { method: "DELETE" });
    const json: ApiResponse<T> = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data as T;
}

export interface StatusResponse {
    files: FileChange[];
    branch: string;
    ahead: number;
    behind: number;
}

export const repoApi = {
    list: () => apiGet<RepoInfo[]>("/api/repos"),

    clone: (url: string, name?: string) =>
        apiPost<RepoInfo>("/api/repos", { url, name }),

    init: (name: string) =>
        apiPost<RepoInfo>("/api/repos", { action: "init", name }),

    addLocal: (path: string) =>
        apiPost<RepoInfo>("/api/repos", { action: "add-local", path }),

    remove: (id: string) =>
        apiDelete<{ success: boolean }>(`/api/repos/${id}`),

    status: (id: string) =>
        apiGet<StatusResponse>(`/api/repos/${id}/status`),

    diff: (id: string, file: string, staged: boolean) =>
        apiGet<string>(`/api/repos/${id}/diff?file=${encodeURIComponent(file)}&staged=${staged}`),

    stage: (id: string, files: string[]) =>
        apiPost<{ success: boolean }>(`/api/repos/${id}/stage`, { files }),

    unstage: (id: string, files: string[]) =>
        apiPost<{ success: boolean }>(`/api/repos/${id}/unstage`, { files }),

    commit: (id: string, message: string) =>
        apiPost<{ hash: string }>(`/api/repos/${id}/commit`, { message }),

    log: (id: string, limit?: number, skip?: number) =>
        apiGet<CommitEntry[]>(`/api/repos/${id}/log?limit=${limit ?? 50}&skip=${skip ?? 0}`),

    commitDetail: (id: string, hash: string) =>
        apiGet<{ commit: CommitEntry; diff: string; stats: { additions: number; deletions: number } }>(`/api/repos/${id}/log/${hash}`),

    branches: (id: string) =>
        apiGet<BranchInfo[]>(`/api/repos/${id}/branches`),

    createBranch: (id: string, name: string) =>
        apiPost<{ success: boolean }>(`/api/repos/${id}/branches`, { name }),

    checkout: (id: string, name: string) =>
        apiPost<{ success: boolean }>(`/api/repos/${id}/branches/checkout`, { name }),

    deleteBranch: (id: string, name: string) =>
        apiDelete<{ success: boolean }>(`/api/repos/${id}/branches/${name}`),

    push: (id: string) =>
        apiPost<{ success: boolean }>(`/api/repos/${id}/push`),

    pull: (id: string) =>
        apiPost<{ success: boolean }>(`/api/repos/${id}/pull`),

    fetch: (id: string) =>
        apiPost<{ success: boolean }>(`/api/repos/${id}/fetch`),

    discard: (id: string, files: string[]) =>
        apiPost<{ success: boolean }>(`/api/repos/${id}/discard`, { files }),

    gitignore: (id: string, pattern: string) =>
        apiPost<{ success: boolean }>(`/api/repos/${id}/gitignore`, { pattern }),

    cherryPick: (id: string, hash: string, targetBranch: string) =>
        apiPost<{ success: boolean }>(`/api/repos/${id}/cherry-pick`, { hash, targetBranch }),
};
