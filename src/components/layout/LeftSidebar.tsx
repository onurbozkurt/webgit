"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRepo } from "@/lib/store";
import { ChangesFileList } from "@/components/repo/ChangesFileList";
import { CommitPanel } from "@/components/repo/CommitPanel";
import { CommitList } from "@/components/repo/CommitList";

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;
const STORAGE_KEY = "webgit-sidebar-width";

function getSavedWidth(): number {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_WIDTH;
    const n = parseInt(saved, 10);
    return n >= MIN_WIDTH && n <= MAX_WIDTH ? n : DEFAULT_WIDTH;
}

export function LeftSidebar() {
    const { state, dispatch } = useRepo();
    const [width, setWidth] = useState(getSavedWidth);
    const isResizing = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(0);
    const currentWidth = useRef(width);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        startX.current = e.clientX;
        startWidth.current = currentWidth.current;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const delta = e.clientX - startX.current;
            const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
            currentWidth.current = newWidth;
            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            if (!isResizing.current) return;
            isResizing.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            localStorage.setItem(STORAGE_KEY, String(currentWidth.current));
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    return (
        <aside
            className="border-r flex flex-col shrink-0 h-full relative"
            style={{ backgroundColor: "var(--card)", width: `${width}px` }}
        >
            {/* Tabs */}
            <div className="flex border-b shrink-0">
                <button
                    onClick={() => dispatch({ type: "SET_TAB", payload: "changes" })}
                    className="flex-1 py-2.5 text-sm font-medium text-center transition-colors relative"
                    style={{
                        color: state.activeTab === "changes" ? "var(--foreground)" : "var(--muted-foreground)",
                    }}
                >
                    Changes
                    {state.fileChanges.length > 0 && (
                        <span
                            className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                            style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
                        >
                            {state.fileChanges.length}
                        </span>
                    )}
                    {state.activeTab === "changes" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: "var(--accent)" }} />
                    )}
                </button>
                <button
                    onClick={() => dispatch({ type: "SET_TAB", payload: "history" })}
                    className="flex-1 py-2.5 text-sm font-medium text-center transition-colors relative"
                    style={{
                        color: state.activeTab === "history" ? "var(--foreground)" : "var(--muted-foreground)",
                    }}
                >
                    History
                    {state.activeTab === "history" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: "var(--accent)" }} />
                    )}
                </button>
            </div>

            {/* Tab content */}
            {state.activeTab === "changes" ? (
                <>
                    <div className="flex-1 overflow-auto">
                        <ChangesFileList />
                    </div>
                    <CommitPanel />
                </>
            ) : (
                <div className="flex-1 overflow-auto">
                    <CommitList />
                </div>
            )}

            {/* Resize handle */}
            <div
                onMouseDown={handleMouseDown}
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-10 hover:bg-[var(--accent)] active:bg-[var(--accent)] transition-colors"
                style={{ backgroundColor: isResizing.current ? "var(--accent)" : "transparent" }}
            />
        </aside>
    );
}
