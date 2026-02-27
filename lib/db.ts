import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "resumes.json");

export interface ResumeRecord {
    id: number;
    filename: string;
    candidate_name: string;
    email: string;
    phone: string;
    location: string;
    visa_status: string;
    current_title: string;
    skills: string;
    experience_years: number;
    full_text: string;
    keywords: string;
    created_at: string;
}

interface DBData {
    nextId: number;
    resumes: ResumeRecord[];
}

function loadDB(): DBData {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
        return { nextId: 1, resumes: [] };
    }
    try {
        const raw = fs.readFileSync(DB_PATH, "utf-8");
        return JSON.parse(raw) as DBData;
    } catch {
        return { nextId: 1, resumes: [] };
    }
}

function saveDB(data: DBData): void {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data), "utf-8");
}

export async function insertResume(data: Omit<ResumeRecord, "id" | "created_at">): Promise<number> {
    const db = loadDB();
    const id = db.nextId++;
    const record: ResumeRecord = {
        ...data,
        id,
        created_at: new Date().toISOString(),
    };
    db.resumes.push(record);
    saveDB(db);
    return id;
}

export async function searchResumes(query: string, limit: number = 200): Promise<ResumeRecord[]> {
    const db = loadDB();
    const terms = query.split(/\s+OR\s+/i).map(t => t.trim().toLowerCase()).filter(Boolean);
    if (terms.length === 0) return [];

    // Score each resume by how many terms match
    const scored = db.resumes.map(resume => {
        const searchText = [
            resume.skills, resume.current_title, resume.candidate_name,
            resume.keywords, resume.full_text.slice(0, 3000),
        ].join(" ").toLowerCase();

        let hits = 0;
        for (const term of terms) {
            if (searchText.includes(term)) hits++;
        }
        return { resume, hits };
    }).filter(s => s.hits > 0)
        .sort((a, b) => b.hits - a.hits)
        .slice(0, limit);

    return scored.map(s => s.resume);
}

export async function getResumeCount(): Promise<number> {
    return loadDB().resumes.length;
}

export async function getResumeById(id: number): Promise<ResumeRecord | undefined> {
    const db = loadDB();
    return db.resumes.find(r => r.id === id);
}

export async function getAllResumes(page: number = 1, limit: number = 50): Promise<{ resumes: ResumeRecord[]; total: number }> {
    const db = loadDB();
    const total = db.resumes.length;
    const start = (page - 1) * limit;
    const resumes = db.resumes.slice(start, start + limit);
    return { resumes, total };
}

export async function deleteResume(id: number): Promise<void> {
    const db = loadDB();
    db.resumes = db.resumes.filter(r => r.id !== id);
    saveDB(db);
}

export async function clearAllResumes(): Promise<void> {
    saveDB({ nextId: 1, resumes: [] });
}
