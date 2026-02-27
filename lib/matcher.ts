import OpenAI from "openai";
import { searchResumes, type ResumeRecord } from "./db";

export interface MatchResult {
    id: number;
    candidate_name: string;
    email: string;
    phone: string;
    location: string;
    visa_status: string;
    current_title: string;
    skills: string;
    experience_years: number;
    match_score: number;
    match_reason: string;
}

// Convert job description to search terms
function jobDescToTerms(jobDesc: string): string[] {
    const stopWords = new Set([
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
        "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
        "did", "will", "would", "could", "should", "shall", "may", "might", "can", "must",
        "we", "you", "they", "he", "she", "it", "i", "me", "my", "your", "our", "their",
        "this", "that", "these", "those", "which", "who", "whom", "what", "where", "when",
        "how", "not", "no", "if", "then", "than", "from", "by", "as", "all", "any", "each",
        "every", "both", "few", "more", "most", "other", "some", "such", "only", "own",
        "about", "above", "after", "again", "also", "am", "another", "because", "before",
        "between", "during", "into", "just", "over", "same", "so", "through", "under", "very",
        "looking", "required", "requirements", "experience", "role", "position", "job", "candidate",
        "work", "working", "team", "company", "client", "need", "needs", "able", "ability",
        "strong", "good", "excellent", "plus", "preferred", "minimum", "least", "years",
    ]);

    return jobDesc
        .toLowerCase()
        .replace(/[^a-z0-9+#.\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
        .filter((w, i, arr) => arr.indexOf(w) === i)
        .slice(0, 30);
}

// AI-powered re-ranking
async function aiRerank(
    jobDesc: string,
    candidates: ResumeRecord[],
    topN: number = 20
): Promise<MatchResult[]> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === "sk-your-key-here") {
        return basicScore(jobDesc, candidates).slice(0, topN);
    }

    const openai = new OpenAI({ apiKey });

    const candidateSummaries = candidates.slice(0, 50).map((c, i) => ({
        index: i, id: c.id, name: c.candidate_name, title: c.current_title,
        skills: c.skills, location: c.location, visa: c.visa_status,
        experience: c.experience_years, summary: c.full_text.slice(0, 500),
    }));

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.1,
            messages: [
                {
                    role: "system",
                    content: `You are an expert IT recruiter AI. Given a job description and candidate profiles, rank by match quality. Return JSON array: [{index, score (0-100), reason}]. Only include score >= 40. Order by score desc. Return ONLY valid JSON.`,
                },
                {
                    role: "user",
                    content: `JOB:\n${jobDesc}\n\nCANDIDATES:\n${JSON.stringify(candidateSummaries, null, 0)}`,
                },
            ],
            max_tokens: 3000,
        });

        const content = response.choices[0]?.message?.content || "[]";
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return basicScore(jobDesc, candidates).slice(0, topN);

        const rankings: { index: number; score: number; reason: string }[] = JSON.parse(jsonMatch[0]);

        return rankings.slice(0, topN).map((r) => {
            const c = candidates[r.index];
            if (!c) return null;
            return {
                id: c.id, candidate_name: c.candidate_name, email: c.email,
                phone: c.phone, location: c.location, visa_status: c.visa_status,
                current_title: c.current_title, skills: c.skills,
                experience_years: c.experience_years,
                match_score: Math.min(100, Math.max(0, r.score)),
                match_reason: r.reason || "Keyword match",
            };
        }).filter(Boolean) as MatchResult[];

    } catch (err) {
        console.error("AI rerank error:", err);
        return basicScore(jobDesc, candidates).slice(0, topN);
    }
}

// Basic keyword scoring (fallback)
function basicScore(jobDesc: string, candidates: ResumeRecord[]): MatchResult[] {
    const jobWords = new Set(
        jobDesc.toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ").split(/\s+/).filter(w => w.length > 2)
    );

    return candidates.map((c) => {
        const resumeWords = new Set(
            (c.skills + " " + c.current_title + " " + c.full_text.slice(0, 2000))
                .toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ").split(/\s+/)
        );

        let matchCount = 0;
        Array.from(jobWords).forEach(word => {
            if (resumeWords.has(word)) matchCount++;
        });

        const score = Math.min(100, Math.round((matchCount / Math.max(jobWords.size, 1)) * 100));

        return {
            id: c.id, candidate_name: c.candidate_name, email: c.email,
            phone: c.phone, location: c.location, visa_status: c.visa_status,
            current_title: c.current_title, skills: c.skills,
            experience_years: c.experience_years, match_score: score,
            match_reason: `${matchCount} keyword matches out of ${jobWords.size} job terms`,
        };
    }).sort((a, b) => b.match_score - a.match_score);
}

// Main search function
export async function findMatches(
    jobDesc: string,
    filters?: { visa?: string; location?: string; minExperience?: number },
    topN: number = 20
): Promise<MatchResult[]> {
    const terms = jobDescToTerms(jobDesc);
    if (terms.length === 0) return [];

    const query = terms.join(" OR ");
    let candidates = await searchResumes(query, 200);

    if (filters?.visa) {
        candidates = candidates.filter(c => c.visa_status.toLowerCase().includes(filters.visa!.toLowerCase()));
    }
    if (filters?.location) {
        candidates = candidates.filter(c => c.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    if (filters?.minExperience) {
        candidates = candidates.filter(c => c.experience_years >= filters.minExperience!);
    }

    if (candidates.length === 0) return [];

    return aiRerank(jobDesc, candidates, topN);
}
