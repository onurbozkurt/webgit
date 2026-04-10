import fs from "fs";
import path from "path";
import type { RepoInfo } from "@/types/git";

const REPOS_BASE_PATH = process.env.REPOS_BASE_PATH || path.join(process.cwd(), "repos");
const REGISTRY_FILE = path.join(REPOS_BASE_PATH, ".registry.json");

function ensureRegistryExists(): void {
    if (!fs.existsSync(REPOS_BASE_PATH)) {
        fs.mkdirSync(REPOS_BASE_PATH, { recursive: true });
    }
    if (!fs.existsSync(REGISTRY_FILE)) {
        fs.writeFileSync(REGISTRY_FILE, JSON.stringify([], null, 4), "utf-8");
    }
}

export function listRepos(): RepoInfo[] {
    ensureRegistryExists();
    const data = fs.readFileSync(REGISTRY_FILE, "utf-8");
    return JSON.parse(data);
}

export function getRepo(id: string): RepoInfo | null {
    const repos = listRepos();
    return repos.find((r) => r.id === id) || null;
}

export function addRepo(repo: RepoInfo): void {
    const repos = listRepos();
    repos.push(repo);
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(repos, null, 4), "utf-8");
}

export function removeRepo(id: string): void {
    let repos = listRepos();
    repos = repos.filter((r) => r.id !== id);
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(repos, null, 4), "utf-8");
}

export function getReposBasePath(): string {
    ensureRegistryExists();
    return REPOS_BASE_PATH;
}
