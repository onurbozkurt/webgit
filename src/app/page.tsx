"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RepoInfo } from "@/types/git";
import { repoApi } from "@/lib/api-client";
import { CloneRepoDialog } from "@/components/repo/CloneRepoDialog";
import { AddLocalRepoDialog } from "@/components/repo/AddLocalRepoDialog";

export default function HomePage() {
    const router = useRouter();
    const [repos, setRepos] = useState<RepoInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showClone, setShowClone] = useState(false);
    const [showAddLocal, setShowAddLocal] = useState(false);

    const loadRepos = async () => {
        try {
            const data = await repoApi.list();
            setRepos(data);
        } catch {
            // empty registry
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRepos();
    }, []);

    const handleRepoAdded = (repo: RepoInfo) => {
        setShowClone(false);
        setShowAddLocal(false);
        router.push(`/repos/${repo.id}`);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="h-14 border-b flex items-center px-6 shrink-0" style={{ backgroundColor: "var(--card)" }}>
                <h1 className="text-lg font-semibold">WebGit</h1>
            </header>

            {/* Content */}
            <main className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">Repositories</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowAddLocal(true)}
                                className="px-4 py-2 rounded-md text-sm font-medium border"
                                style={{
                                    borderColor: "var(--border)",
                                    backgroundColor: "var(--secondary)",
                                    color: "var(--foreground)",
                                }}
                            >
                                Add Local Repository
                            </button>
                            <button
                                onClick={() => setShowClone(true)}
                                className="px-4 py-2 rounded-md text-sm font-medium"
                                style={{
                                    backgroundColor: "var(--primary)",
                                    color: "var(--primary-foreground)",
                                }}
                            >
                                Clone Repository
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
                            Loading...
                        </div>
                    ) : repos.length === 0 ? (
                        <div
                            className="text-center py-12 rounded-lg border"
                            style={{
                                backgroundColor: "var(--card)",
                                color: "var(--muted-foreground)",
                            }}
                        >
                            <svg className="mx-auto mb-4 w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <p className="text-lg mb-2">No repositories yet</p>
                            <p className="text-sm">Add a local repository or clone one to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {repos.map((repo) => (
                                <button
                                    key={repo.id}
                                    onClick={() => router.push(`/repos/${repo.id}`)}
                                    className="w-full text-left p-4 rounded-lg border hover:border-blue-500/50 transition-colors"
                                    style={{ backgroundColor: "var(--card)" }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="font-medium">{repo.name}</p>
                                            <p className="text-sm mt-1 truncate" style={{ color: "var(--muted-foreground)" }}>
                                                {repo.remoteUrl || repo.path}
                                            </p>
                                        </div>
                                        <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {showClone && (
                <CloneRepoDialog
                    onClose={() => setShowClone(false)}
                    onCloned={handleRepoAdded}
                />
            )}

            {showAddLocal && (
                <AddLocalRepoDialog
                    onClose={() => setShowAddLocal(false)}
                    onAdded={handleRepoAdded}
                />
            )}
        </div>
    );
}
