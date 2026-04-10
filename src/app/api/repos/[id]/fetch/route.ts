import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/repo-registry";
import { fetchRemote } from "@/lib/git";

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const repo = getRepo(id);
        if (!repo) {
            return NextResponse.json({ error: "Repository not found" }, { status: 404 });
        }

        await fetchRemote(repo.path);
        return NextResponse.json({ data: { success: true } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
