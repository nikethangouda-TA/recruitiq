import { NextResponse } from "next/server";
import { parseResume } from "@/lib/parser";
import { insertResume, getResumeCount } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        const results: { filename: string; status: string; error?: string }[] = [];

        for (const file of files) {
            try {
                const buffer = Buffer.from(await file.arrayBuffer());
                const parsed = await parseResume(buffer, file.name);

                await insertResume({
                    filename: file.name,
                    candidate_name: parsed.candidate_name,
                    email: parsed.email,
                    phone: parsed.phone,
                    location: parsed.location,
                    visa_status: parsed.visa_status,
                    current_title: parsed.current_title,
                    skills: parsed.skills,
                    experience_years: parsed.experience_years,
                    full_text: parsed.text,
                    keywords: parsed.keywords,
                    updated_at: new Date().toISOString(),
                });

                results.push({ filename: file.name, status: "success" });
            } catch (err) {
                console.error(`Error parsing ${file.name}:`, err);
                results.push({ filename: file.name, status: "error", error: String(err) });
            }
        }

        const total = await getResumeCount();
        return NextResponse.json({ results, totalResumes: total });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}

export async function GET() {
    const total = await getResumeCount();
    return NextResponse.json({ totalResumes: total });
}
