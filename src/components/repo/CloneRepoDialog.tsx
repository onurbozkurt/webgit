"use client";

import { useState } from "react";
import type { RepoInfo } from "@/types/git";
import { repoApi } from "@/lib/api-client";

interface CloneRepoDialogProps {
    onClose: () => void;
    onCloned: (repo: RepoInfo) => void;
}

export function CloneRepoDialog({ onClose, onCloned }: CloneRepoDialogProps) {
    const [url, setUrl] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const repo = await repoApi.clone(url.trim(), name.trim() || undefined);
            onCloned(repo);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div
                className="relative w-full max-w-md rounded-lg border p-6 shadow-xl"
                style={{ backgroundColor: "var(--card)" }}
            >
                <h3 className="text-lg font-semibold mb-4">Clone Repository</h3>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                                Repository URL
                            </label>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://github.com/user/repo.git"
                                className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
                                style={{
                                    backgroundColor: "var(--input)",
                                    borderColor: "var(--border)",
                                    color: "var(--foreground)",
                                }}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                                Local Name (optional)
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="my-repo"
                                className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
                                style={{
                                    backgroundColor: "var(--input)",
                                    borderColor: "var(--border)",
                                    color: "var(--foreground)",
                                }}
                            />
                        </div>

                        {error && (
                            <div
                                className="text-sm p-3 rounded-md"
                                style={{ backgroundColor: "rgba(218, 54, 51, 0.1)", color: "var(--destructive)" }}
                            >
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-md text-sm border"
                            style={{
                                backgroundColor: "var(--secondary)",
                                borderColor: "var(--border)",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!url.trim() || loading}
                            className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                            style={{
                                backgroundColor: "var(--primary)",
                                color: "var(--primary-foreground)",
                            }}
                        >
                            {loading ? "Cloning..." : "Clone"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
