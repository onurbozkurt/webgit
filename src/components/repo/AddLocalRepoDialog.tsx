"use client";

import { useState } from "react";
import type { RepoInfo } from "@/types/git";
import { repoApi } from "@/lib/api-client";

interface AddLocalRepoDialogProps {
    onClose: () => void;
    onAdded: (repo: RepoInfo) => void;
}

export function AddLocalRepoDialog({ onClose, onAdded }: AddLocalRepoDialogProps) {
    const [path, setPath] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!path.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const repo = await repoApi.addLocal(path.trim());
            onAdded(repo);
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
                <h3 className="text-lg font-semibold mb-4">Add Local Repository</h3>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                                Repository Path
                            </label>
                            <input
                                type="text"
                                value={path}
                                onChange={(e) => setPath(e.target.value)}
                                placeholder="/home/user/projects/my-repo"
                                className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
                                style={{
                                    backgroundColor: "var(--input)",
                                    borderColor: "var(--border)",
                                    color: "var(--foreground)",
                                }}
                                autoFocus
                            />
                            <p className="text-xs mt-1.5" style={{ color: "var(--muted-foreground)" }}>
                                Enter the absolute path to an existing git repository
                            </p>
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
                            disabled={!path.trim() || loading}
                            className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                            style={{
                                backgroundColor: "var(--primary)",
                                color: "var(--primary-foreground)",
                            }}
                        >
                            {loading ? "Adding..." : "Add Repository"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
