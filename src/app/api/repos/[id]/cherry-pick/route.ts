import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/repo-registry";
import { cherryPick } from "@/lib/git";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const repo = getRepo(id);
        if (!repo) {
            return NextResponse.json({ error: "Repository not found" }, { status: 404 });
        }

        const { hash, targetBranch } = await request.json();
        if (!hash || !targetBranch) {
            return NextResponse.json(
                { error: "Commit hash and target branch are required" },
                { status: 400 }
            );
        }

        await cherryPick(repo.path, hash, targetBranch);
        return NextResponse.json({ data: { success: true } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
