"use client";

import { useState } from "react";
import { useRepo } from "@/lib/store";

export function CommitPanel() {
    const { state, doCommit } = useRepo();
    const [message, setMessage] = useState("");
    const isLoading = state.loading["commit"];
    const stagedCount = state.fileChanges.filter((f) => f.isStaged).length;

    const handleSubmit = async () => {
        if (!message.trim() || stagedCount === 0) return;
        await doCommit(message.trim());
        setMessage("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const summaryLine = message.split("\n")[0];
    const summaryLength = summaryLine.length;

    return (
        <div className="border-t p-3 shrink-0">
            <div className="relative">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Commit message"
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2 resize-none"
                    style={{
                        backgroundColor: "var(--input)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                    }}
                />
                {summaryLength > 0 && (
                    <span
                        className="absolute top-2 right-2 text-xs"
                        style={{
                            color: summaryLength > 72 ? "var(--destructive)" : "var(--muted-foreground)",
                        }}
                    >
                        {summaryLength}
                    </span>
                )}
            </div>
            <button
                onClick={handleSubmit}
                disabled={!message.trim() || stagedCount === 0 || isLoading}
                className="w-full mt-2 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                }}
            >
                {isLoading
                    ? "Committing..."
                    : `Commit to ${state.currentBranch || "main"}`}
            </button>
            {stagedCount === 0 && state.fileChanges.length > 0 && (
                <p className="text-xs mt-1.5 text-center" style={{ color: "var(--muted-foreground)" }}>
                    Stage files to commit
                </p>
            )}
        </div>
    );
}
