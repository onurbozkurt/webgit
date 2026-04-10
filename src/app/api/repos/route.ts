import { NextRequest, NextResponse } from "next/server";
import { listRepos } from "@/lib/repo-registry";
import { cloneRepo, initRepo, addLocalRepo } from "@/lib/git";

export async function GET() {
    try {
        const repos = listRepos();
        return NextResponse.json({ data: repos });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, name, action } = body;

        if (action === "add-local") {
            const { path: localPath } = body;
            if (!localPath) {
                return NextResponse.json({ error: "Path is required" }, { status: 400 });
            }
            const repo = await addLocalRepo(localPath);
            return NextResponse.json({ data: repo });
        }

        if (action === "init") {
            if (!name) {
                return NextResponse.json({ error: "Name is required" }, { status: 400 });
            }
            const repo = await initRepo(name);
            return NextResponse.json({ data: repo });
        }

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }
        const repo = await cloneRepo(url, name);
        return NextResponse.json({ data: repo });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
