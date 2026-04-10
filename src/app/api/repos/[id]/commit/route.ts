import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/repo-registry";
import { commit } from "@/lib/git";

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

        const { message } = await request.json();
        if (!message || !message.trim()) {
            return NextResponse.json({ error: "Commit message is required" }, { status: 400 });
        }

        const hash = await commit(repo.path, message.trim());
        return NextResponse.json({ data: { hash } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
