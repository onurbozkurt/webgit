import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/repo-registry";
import { getCommitDetails } from "@/lib/git";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string; hash: string }> }
) {
    try {
        const { id, hash } = await params;
        const repo = getRepo(id);
        if (!repo) {
            return NextResponse.json({ error: "Repository not found" }, { status: 404 });
        }

        const details = await getCommitDetails(repo.path, hash);
        return NextResponse.json({ data: details });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
