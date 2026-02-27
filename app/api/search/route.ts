import { NextResponse } from "next/server";
import { findMatches } from "@/lib/matcher";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { jobDescription, visa, location, minExperience, topN } = body;

        if (!jobDescription || jobDescription.trim().length < 10) {
            return NextResponse.json({ error: "Please provide a job description (at least 10 characters)" }, { status: 400 });
        }

        const filters: { visa?: string; location?: string; minExperience?: number } = {};
        if (visa) filters.visa = visa;
        if (location) filters.location = location;
        if (minExperience) filters.minExperience = Number(minExperience);

        const results = await findMatches(
            jobDescription,
            Object.keys(filters).length > 0 ? filters : undefined,
            topN || 20
        );

        return NextResponse.json({ results, count: results.length });

    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
