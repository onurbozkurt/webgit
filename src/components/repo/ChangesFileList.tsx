"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRepo } from "@/lib/store";
import type { FileChange } from "@/types/git";

function statusColor(index: string, workingDir: string): string {
    if (index === "?" || workingDir === "?") return "#d29922";
    if (index === "A" || workingDir === "A") return "#3fb950";
    if (index === "D" || workingDir === "D") return "#da3633";
    if (index === "R" || workingDir === "R") return "#1f6feb";
    return "#d29922";
}

function statusLabel(index: string, workingDir: string): string {
    const char = index !== " " && index !== "?" ? index : workingDir;
    switch (char) {
        case "M": return "M";
        case "A": return "A";
        case "D": return "D";
        case "R": return "R";
        case "?": return "U";
        default: return char;
    }
}

interface ContextMenuState {
    x: number;
    y: number;
    file: FileChange;
}

function FileItem({
    file,
    isSelected,
    onSelect,
    onToggleStage,
    onContextMenu,
}: {
    file: FileChange;
    isSelected: boolean;
    onSelect: () => void;
    onToggleStage: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}) {
    const fileName = file.path.split("/").pop() || file.path;
    const dirPath = file.path.includes("/") ? file.path.substring(0, file.path.lastIndexOf("/")) + "/" : "";
    const color = statusColor(file.index, file.workingDir);

    return (
        <div
            className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover-bg transition-colors group"
            style={{
                backgroundColor: isSelected ? "var(--selection)" : undefined,
            }}
            onClick={onSelect}
            onContextMenu={onContextMenu}
        >
            <input
                type="checkbox"
                checked={file.isStaged}
                onChange={(e) => {
                    e.stopPropagation();
                    onToggleStage();
                }}
                className="shrink-0 rounded cursor-pointer"
                onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                    <span className="text-sm truncate">{fileName}</span>
                </div>
                {dirPath && (
                    <span className="text-xs truncate block" style={{ color: "var(--muted-foreground)" }}>
                        {dirPath}
                    </span>
                )}
            </div>
            <span
                className="text-xs font-mono font-bold shrink-0"
                style={{ color }}
            >
                {statusLabel(file.index, file.workingDir)}
            </span>
        </div>
    );
}

function ContextMenu({
    x,
    y,
    file,
    repoPath,
    onClose,
}: {
    x: number;
    y: number;
    file: FileChange;
    repoPath: string;
    onClose: () => void;
}) {
    const { doDiscard, doGitignore, refreshStatus } = useRepo();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [onClose]);

    // Adjust position if menu would overflow viewport
    useEffect(() => {
        if (!menuRef.current) return;
        const rect = menuRef.current.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            menuRef.current.style.top = `${y - rect.height}px`;
        }
        if (rect.right > window.innerWidth) {
            menuRef.current.style.left = `${x - rect.width}px`;
        }
    }, [x, y]);

    const fileName = file.path.split("/").pop() || file.path;
    const folderPath = file.path.includes("/")
        ? file.path.substring(0, file.path.lastIndexOf("/")) + "/"
        : "";
    const ext = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")) : "";
    const fullPath = repoPath + "/" + file.path;

    const handleAction = async (fn: () => Promise<void>) => {
        onClose();
        await fn();
    };

    const menuItems: { label: string; action: () => Promise<void>; destructive?: boolean }[] = [
        {
            label: "Discard Changes",
            destructive: true,
            action: () => doDiscard([file.path]),
        },
    ];

    const ignoreItems: { label: string; action: () => Promise<void> }[] = [
        {
            label: `Ignore File (Add to .gitignore)`,
            action: () => doGitignore(file.path),
        },
    ];

    if (folderPath) {
        ignoreItems.push({
            label: `Ignore Folder (Add to .gitignore)`,
            action: () => doGitignore(folderPath),
        });
    }

    if (ext) {
        ignoreItems.push({
            label: `Ignore All *${ext} Files (Add to .gitignore)`,
            action: () => doGitignore(`*${ext}`),
        });
    }

    const copyItems: { label: string; action: () => Promise<void> }[] = [
        {
            label: "Copy File Path",
            action: async () => {
                await navigator.clipboard.writeText(fullPath);
            },
        },
        {
            label: "Copy Relative File Path",
            action: async () => {
                await navigator.clipboard.writeText(file.path);
            },
        },
    ];

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] flex flex-col rounded-lg border shadow-xl py-1 text-sm"
            style={{
                left: `${x}px`,
                top: `${y}px`,
                backgroundColor: "var(--popover)",
                color: "var(--popover-foreground)",
            }}
        >
            {menuItems.map((item) => (
                <button
                    key={item.label}
                    onClick={() => handleAction(item.action)}
                    className="text-left px-3 py-1.5 hover-bg transition-colors whitespace-nowrap"
                    style={item.destructive ? { color: "var(--destructive)" } : undefined}
                >
                    {item.label}
                </button>
            ))}

            <div className="my-1 border-t" />

            {ignoreItems.map((item) => (
                <button
                    key={item.label}
                    onClick={() => handleAction(item.action)}
                    className="text-left px-3 py-1.5 hover-bg transition-colors whitespace-nowrap"
                >
                    {item.label}
                </button>
            ))}

            <div className="my-1 border-t" />

            {copyItems.map((item) => (
                <button
                    key={item.label}
                    onClick={() => handleAction(item.action)}
                    className="text-left px-3 py-1.5 hover-bg transition-colors whitespace-nowrap"
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}

export function ChangesFileList() {
    const { state, dispatch, stageFiles, unstageFiles, loadFileDiff } = useRepo();
    const { fileChanges, selectedFile, repoPath } = state;
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const stagedFiles = fileChanges.filter((f) => f.isStaged);
    const unstagedFiles = fileChanges.filter((f) => !f.isStaged);

    const handleSelect = (file: FileChange) => {
        dispatch({ type: "SELECT_FILE", payload: file.path });
        loadFileDiff(file.path, file.isStaged);
    };

    const handleToggleStage = (file: FileChange) => {
        if (file.isStaged) {
            unstageFiles([file.path]);
        } else {
            stageFiles([file.path]);
        }
    };

    const handleContextMenu = useCallback((e: React.MouseEvent, file: FileChange) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, file });
    }, []);

    const handleStageAll = () => {
        const paths = unstagedFiles.map((f) => f.path);
        if (paths.length > 0) stageFiles(paths);
    };

    const handleUnstageAll = () => {
        const paths = stagedFiles.map((f) => f.path);
        if (paths.length > 0) unstageFiles(paths);
    };

    if (fileChanges.length === 0) {
        return (
            <div className="flex items-center justify-center h-full" style={{ color: "var(--muted-foreground)" }}>
                <div className="text-center p-4">
                    <svg className="mx-auto mb-2 w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm">No local changes</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Staged */}
            {stagedFiles.length > 0 && (
                <div>
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                        <span className="text-xs font-medium uppercase" style={{ color: "var(--muted-foreground)" }}>
                            Staged Changes ({stagedFiles.length})
                        </span>
                        <button
                            onClick={handleUnstageAll}
                            className="text-xs hover:underline"
                            style={{ color: "var(--accent)" }}
                        >
                            Unstage All
                        </button>
                    </div>
                    {stagedFiles.map((file) => (
                        <FileItem
                            key={`staged-${file.path}`}
                            file={file}
                            isSelected={selectedFile === file.path}
                            onSelect={() => handleSelect(file)}
                            onToggleStage={() => handleToggleStage(file)}
                            onContextMenu={(e) => handleContextMenu(e, file)}
                        />
                    ))}
                </div>
            )}

            {/* Unstaged */}
            {unstagedFiles.length > 0 && (
                <div>
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                        <span className="text-xs font-medium uppercase" style={{ color: "var(--muted-foreground)" }}>
                            Changes ({unstagedFiles.length})
                        </span>
                        <button
                            onClick={handleStageAll}
                            className="text-xs hover:underline"
                            style={{ color: "var(--accent)" }}
                        >
                            Stage All
                        </button>
                    </div>
                    {unstagedFiles.map((file) => (
                        <FileItem
                            key={`unstaged-${file.path}`}
                            file={file}
                            isSelected={selectedFile === file.path}
                            onSelect={() => handleSelect(file)}
                            onToggleStage={() => handleToggleStage(file)}
                            onContextMenu={(e) => handleContextMenu(e, file)}
                        />
                    ))}
                </div>
            )}

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    file={contextMenu.file}
                    repoPath={repoPath}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
}
