import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/repo-registry";
import { getFileDiff } from "@/lib/git";

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
        const file = searchParams.get("file");
        const staged = searchParams.get("staged") === "true";

        if (!file) {
            return NextResponse.json({ error: "File parameter is required" }, { status: 400 });
        }

        const diff = await getFileDiff(repo.path, file, staged);
        return NextResponse.json({ data: diff });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
