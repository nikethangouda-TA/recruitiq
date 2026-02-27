import { NextResponse } from "next/server";
import { getResumeById } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Resume ID required" }, { status: 400 });
    }

    const resume = await getResumeById(Number(id));
    if (!resume) {
        return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json(resume);
}
