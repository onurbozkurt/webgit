import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/repo-registry";
import { getLog } from "@/lib/git";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const repo = getRepo(id);
        if (!repo) {
            return NextResponse.json({ error: "Repository not found" }, { status: 404 });
        }

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const skip = parseInt(searchParams.get("skip") || "0", 10);

        const commits = await getLog(repo.path, limit, skip);
        return NextResponse.json({ data: commits });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
