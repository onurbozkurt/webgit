export interface RepoInfo {
    id: string;
    name: string;
    path: string;
    remoteUrl?: string;
    createdAt: string;
}

export interface FileChange {
    path: string;
    index: string;
    workingDir: string;
    isStaged: boolean;
}

export interface FileDiff {
    path: string;
    oldPath?: string;
    content: string;
}

export interface CommitEntry {
    hash: string;
    abbreviatedHash: string;
    author: string;
    email: string;
    date: string;
    message: string;
    body: string;
    refs: string;
}

export interface BranchInfo {
    name: string;
    current: boolean;
    commit: string;
    label: string;
    isRemote: boolean;
    lastCommitDate: string;
}

export interface ApiResponse<T> {
    data?: T;
    error?: string;
}
