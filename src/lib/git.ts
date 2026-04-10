import simpleGit, { SimpleGit } from "simple-git";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { RepoInfo, FileChange, CommitEntry, BranchInfo } from "@/types/git";
import { addRepo, getReposBasePath } from "./repo-registry";

function getGit(repoPath: string): SimpleGit {
    return simpleGit(repoPath);
}

export async function cloneRepo(url: string, name?: string): Promise<RepoInfo> {
    const basePath = getReposBasePath();
    const repoName = name || url.split("/").pop()?.replace(".git", "") || "repo";
    const repoPath = path.join(basePath, repoName);
    const git = simpleGit(basePath);

    await git.clone(url, repoPath);

    const repo: RepoInfo = {
        id: uuidv4(),
        name: repoName,
        path: repoPath,
        remoteUrl: url,
        createdAt: new Date().toISOString(),
    };

    addRepo(repo);
    return repo;
}

export async function addLocalRepo(localPath: string): Promise<RepoInfo> {
    const git = simpleGit(localPath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
        throw new Error("The specified path is not a git repository");
    }

    const repoName = path.basename(localPath);
    let remoteUrl: string | undefined;
    try {
        const remotes = await git.getRemotes(true);
        const origin = remotes.find((r) => r.name === "origin");
        if (origin) remoteUrl = origin.refs.fetch;
    } catch {
        // no remotes
    }

    const repo: RepoInfo = {
        id: uuidv4(),
        name: repoName,
        path: localPath,
        remoteUrl,
        createdAt: new Date().toISOString(),
    };

    addRepo(repo);
    return repo;
}

export async function initRepo(name: string): Promise<RepoInfo> {
    const basePath = getReposBasePath();
    const repoPath = path.join(basePath, name);
    const git = simpleGit(basePath);

    await git.raw(["init", repoPath]);

    const repo: RepoInfo = {
        id: uuidv4(),
        name,
        path: repoPath,
        createdAt: new Date().toISOString(),
    };

    addRepo(repo);
    return repo;
}

export async function getStatus(repoPath: string): Promise<FileChange[]> {
    const git = getGit(repoPath);
    const status = await git.status();
    const changes: FileChange[] = [];

    for (const file of status.files) {
        changes.push({
            path: file.path,
            index: file.index || " ",
            workingDir: file.working_dir || " ",
            isStaged: file.index !== " " && file.index !== "?",
        });
    }

    return changes;
}

export async function getFileDiff(
    repoPath: string,
    filePath: string,
    staged: boolean
): Promise<string> {
    const git = getGit(repoPath);

    if (staged) {
        return await git.diff(["--cached", "--", filePath]);
    }

    const status = await git.status();
    const file = status.files.find((f) => f.path === filePath);
    if (file && file.working_dir === "?") {
        // Untracked file — show full content as addition
        const raw = await git.raw(["diff", "--no-index", "/dev/null", filePath]).catch((err) => {
            // git diff --no-index exits with 1 when files differ
            return err.message || "";
        });
        return raw;
    }

    return await git.diff(["--", filePath]);
}

export async function stageFiles(repoPath: string, files: string[]): Promise<void> {
    const git = getGit(repoPath);
    await git.add(files);
}

export async function unstageFiles(repoPath: string, files: string[]): Promise<void> {
    const git = getGit(repoPath);
    await git.reset(["HEAD", "--", ...files]);
}

export async function commit(repoPath: string, message: string): Promise<string> {
    const git = getGit(repoPath);
    const result = await git.commit(message);
    return result.commit;
}

export async function getLog(
    repoPath: string,
    limit: number = 50,
    skip: number = 0
): Promise<CommitEntry[]> {
    const git = getGit(repoPath);

    const FIELD_SEP = "---GIT_FIELD_SEP---";
    const RECORD_SEP = "---GIT_RECORD_SEP---";
    const format = ["%H", "%h", "%an", "%ae", "%aI", "%s", "%b", "%D"].join(FIELD_SEP) + RECORD_SEP;

    const raw = await git.raw([
        "log",
        `--max-count=${limit}`,
        `--skip=${skip}`,
        `--format=${format}`,
    ]);

    if (!raw.trim()) return [];

    return raw.split(RECORD_SEP).filter((r) => r.trim()).map((record) => {
        const parts = record.trim().split(FIELD_SEP);
        return {
            hash: parts[0] || "",
            abbreviatedHash: parts[1] || "",
            author: parts[2] || "",
            email: parts[3] || "",
            date: parts[4] || "",
            message: parts[5] || "",
            body: (parts[6] || "").trim(),
            refs: parts[7] || "",
        };
    });
}

export async function getCommitDiff(repoPath: string, hash: string): Promise<string> {
    const git = getGit(repoPath);
    try {
        return await git.diff([`${hash}^`, hash]);
    } catch {
        // First commit — no parent
        return await git.diff(["--root", hash]);
    }
}

export async function getCommitDetails(
    repoPath: string,
    hash: string
): Promise<{ commit: CommitEntry; diff: string; stats: { additions: number; deletions: number } }> {
    const git = getGit(repoPath);

    const SEP = "---GIT_FIELD_SEP---";
    const format = ["%H", "%h", "%an", "%ae", "%aI", "%s", "%b", "%D"].join(SEP);
    const raw = await git.raw(["show", "-s", `--format=${format}`, hash]);
    const parts = raw.trim().split(SEP);

    const commitEntry: CommitEntry = {
        hash: parts[0] || hash,
        abbreviatedHash: parts[1] || hash.substring(0, 7),
        author: parts[2] || "",
        email: parts[3] || "",
        date: parts[4] || "",
        message: parts[5] || "",
        body: (parts[6] || "").trim(),
        refs: parts[7] || "",
    };

    const statRaw = await git.raw(["diff", "--shortstat", `${hash}^`, hash]).catch(() => "");
    let additions = 0;
    let deletions = 0;
    const addMatch = statRaw.match(/(\d+) insertion/);
    const delMatch = statRaw.match(/(\d+) deletion/);
    if (addMatch) additions = parseInt(addMatch[1], 10);
    if (delMatch) deletions = parseInt(delMatch[1], 10);

    const diff = await getCommitDiff(repoPath, hash);
    return { commit: commitEntry, diff, stats: { additions, deletions } };
}

export async function getBranches(repoPath: string): Promise<BranchInfo[]> {
    const git = getGit(repoPath);
    const branches = await git.branch(["-a", "-v"]);

    // Get last commit dates sorted by most recent
    const refDates = new Map<string, string>();
    try {
        const localRefs = await git.raw([
            "for-each-ref",
            "--sort=-committerdate",
            "--format=%(refname:short)\t%(committerdate:iso-strict)",
            "refs/heads/",
            "refs/remotes/",
        ]);
        for (const line of localRefs.trim().split("\n")) {
            if (!line) continue;
            const [refName, date] = line.split("\t");
            if (refName && date) refDates.set(refName, date);
        }
    } catch {
        // fallback: no date info
    }

    const result = Object.entries(branches.branches).map(([name, info]) => ({
        name: info.name,
        current: info.current,
        commit: info.commit,
        label: info.label,
        isRemote: name.startsWith("remotes/"),
        lastCommitDate: refDates.get(info.name) || "",
    }));

    // Sort by last commit date descending, current branch always first
    result.sort((a, b) => {
        if (a.current) return -1;
        if (b.current) return 1;
        if (!a.lastCommitDate && !b.lastCommitDate) return 0;
        if (!a.lastCommitDate) return 1;
        if (!b.lastCommitDate) return -1;
        return new Date(b.lastCommitDate).getTime() - new Date(a.lastCommitDate).getTime();
    });

    return result;
}

export async function createBranch(repoPath: string, name: string): Promise<void> {
    const git = getGit(repoPath);
    await git.checkoutLocalBranch(name);
}

export async function switchBranch(repoPath: string, name: string): Promise<void> {
    const git = getGit(repoPath);
    await git.checkout(name);
}

export async function deleteBranch(repoPath: string, name: string): Promise<void> {
    const git = getGit(repoPath);
    await git.deleteLocalBranch(name);
}

export async function push(
    repoPath: string,
    remote: string = "origin",
    branch?: string
): Promise<void> {
    const git = getGit(repoPath);
    const currentBranch = branch || (await git.branch()).current;
    await git.push(remote, currentBranch, ["--set-upstream"]);
}

export async function pull(
    repoPath: string,
    remote: string = "origin",
    branch?: string
): Promise<void> {
    const git = getGit(repoPath);
    const currentBranch = branch || (await git.branch()).current;
    await git.pull(remote, currentBranch);
}

export async function fetchRemote(repoPath: string): Promise<void> {
    const git = getGit(repoPath);
    await git.fetch();
}

export async function getAheadBehind(
    repoPath: string
): Promise<{ ahead: number; behind: number }> {
    const git = getGit(repoPath);
    const status = await git.status();
    return {
        ahead: status.ahead,
        behind: status.behind,
    };
}

export async function getCurrentBranch(repoPath: string): Promise<string> {
    const git = getGit(repoPath);
    const branch = await git.branch();
    return branch.current;
}

export async function discardChanges(repoPath: string, files: string[]): Promise<void> {
    const git = getGit(repoPath);
    const status = await git.status();

    const untrackedFiles: string[] = [];
    const trackedFiles: string[] = [];

    for (const file of files) {
        const fileStatus = status.files.find((f) => f.path === file);
        if (fileStatus && fileStatus.working_dir === "?" && fileStatus.index === "?") {
            untrackedFiles.push(file);
        } else {
            trackedFiles.push(file);
        }
    }

    if (trackedFiles.length > 0) {
        await git.checkout(["--", ...trackedFiles]);
    }

    for (const file of untrackedFiles) {
        const fullPath = path.join(repoPath, file);
        fs.rmSync(fullPath, { recursive: true, force: true });
    }
}

export async function cherryPick(
    repoPath: string,
    commitHash: string,
    targetBranch: string
): Promise<void> {
    const git = getGit(repoPath);
    const currentBranch = (await git.branch()).current;

    try {
        await git.checkout(targetBranch);
        await git.raw(["cherry-pick", commitHash]);
    } catch (err) {
        await git.raw(["cherry-pick", "--abort"]).catch(() => {});
        throw err;
    } finally {
        await git.checkout(currentBranch);
    }
}

export async function addToGitignore(repoPath: string, pattern: string): Promise<void> {
    const gitignorePath = path.join(repoPath, ".gitignore");
    let content = "";

    if (fs.existsSync(gitignorePath)) {
        content = fs.readFileSync(gitignorePath, "utf-8");
    }

    const lines = content.split("\n");
    if (!lines.some((line) => line.trim() === pattern)) {
        if (content.length > 0 && !content.endsWith("\n")) {
            content += "\n";
        }
        content += pattern + "\n";
        fs.writeFileSync(gitignorePath, content, "utf-8");
    }
}
