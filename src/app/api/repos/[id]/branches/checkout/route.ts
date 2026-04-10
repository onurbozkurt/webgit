import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/repo-registry";
import { switchBranch } from "@/lib/git";

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

        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
        }

        await switchBranch(repo.path, name);
        return NextResponse.json({ data: { success: true } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
