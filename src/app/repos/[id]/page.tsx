"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import type { RepoInfo } from "@/types/git";
import { repoApi } from "@/lib/api-client";
import { RepoProvider } from "@/lib/store";
import { RepoWorkspace } from "@/components/repo/RepoWorkspace";

export default function RepoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [repo, setRepo] = useState<RepoInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        repoApi.list().then((repos) => {
            const found = repos.find((r) => r.id === id);
            if (found) {
                setRepo(found);
            } else {
                router.push("/");
            }
            setLoading(false);
        });
    }, [id, router]);

    if (loading || !repo) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
                Loading repository...
            </div>
        );
    }

    return (
        <RepoProvider repoId={repo.id} repoName={repo.name} repoPath={repo.path}>
            <RepoWorkspace />
        </RepoProvider>
    );
}
