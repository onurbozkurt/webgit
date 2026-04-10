import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/repo-registry";
import { getStatus, getCurrentBranch, getAheadBehind } from "@/lib/git";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const repo = getRepo(id);
        if (!repo) {
            return NextResponse.json({ error: "Repository not found" }, { status: 404 });
        }

        const [files, branch, aheadBehind] = await Promise.all([
            getStatus(repo.path),
            getCurrentBranch(repo.path),
            getAheadBehind(repo.path).catch(() => ({ ahead: 0, behind: 0 })),
        ]);

        return NextResponse.json({
            data: { files, branch, ...aheadBehind },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
