import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/repo-registry";
import { deleteBranch } from "@/lib/git";

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string; name: string }> }
) {
    try {
        const { id, name } = await params;
        const repo = getRepo(id);
        if (!repo) {
            return NextResponse.json({ error: "Repository not found" }, { status: 404 });
        }

        await deleteBranch(repo.path, name);
        return NextResponse.json({ data: { success: true } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
