import pdf from "pdf-parse";
import mammoth from "mammoth";

export interface ParsedResume {
    text: string;
    candidate_name: string;
    email: string;
    phone: string;
    skills: string;
    current_title: string;
    location: string;
    visa_status: string;
    experience_years: number;
    keywords: string;
}

// Extract text from PDF buffer
async function parsePDF(buffer: Buffer): Promise<string> {
    try {
        const data = await pdf(buffer);
        return data.text || "";
    } catch (err) {
        console.error("PDF parse error:", err);
        return "";
    }
}

// Extract text from Word doc buffer
async function parseDocx(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || "";
    } catch (err) {
        console.error("DOCX parse error:", err);
        return "";
    }
}

// Extract email addresses
function extractEmails(text: string): string {
    const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    return matches ? matches[0] : "";
}

// Extract phone numbers
function extractPhones(text: string): string {
    const matches = text.match(/[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/g);
    if (!matches) return "";
    // Return the longest match (most likely to be a full phone number)
    return matches.sort((a, b) => b.length - a.length)[0] || "";
}

// Extract candidate name (first non-empty line, or first line with mostly alpha chars)
function extractName(text: string): string {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2 && l.length < 60);
    for (const line of lines.slice(0, 5)) {
        // Skip lines that look like emails, phones, or addresses
        if (line.includes("@") || /^\+?\d/.test(line)) continue;
        // Name-like: mostly letters and spaces
        const alphaRatio = (line.match(/[a-zA-Z\s]/g) || []).length / line.length;
        if (alphaRatio > 0.8) return line;
    }
    return lines[0] || "Unknown";
}

// Common IT skills to look for
const SKILL_PATTERNS = [
    "java", "python", "javascript", "typescript", "react", "angular", "vue", "node",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins",
    "sql", "mysql", "postgresql", "mongodb", "oracle", "redis",
    "spring", "django", ".net", "c#", "c\\+\\+", "go", "rust", "ruby", "php",
    "html", "css", "sass", "webpack", "git", "linux", "unix",
    "rest", "graphql", "microservices", "api", "ci/cd", "devops",
    "machine learning", "deep learning", "nlp", "tensorflow", "pytorch",
    "data engineering", "etl", "spark", "hadoop", "kafka", "airflow",
    "salesforce", "sap", "servicenow", "jira", "confluence",
    "agile", "scrum", "kanban", "project management",
    "power bi", "tableau", "excel", "vba",
    "selenium", "cypress", "jest", "junit", "testing",
    "figma", "sketch", "adobe", "ui/ux",
    "blockchain", "solidity", "web3",
    "ios", "android", "swift", "kotlin", "flutter", "react native",
    "mainframe", "cobol", "as400",
    "pega", "mulesoft", "informatica", "talend",
    "snowflake", "databricks", "redshift", "bigquery",
];

function extractSkills(text: string): string {
    const lower = text.toLowerCase();
    const found: string[] = [];
    for (const skill of SKILL_PATTERNS) {
        const regex = new RegExp(`\\b${skill}\\b`, "i");
        if (regex.test(lower)) {
            found.push(skill.replace("\\+\\+", "++"));
        }
    }
    return [...new Set(found)].join(", ");
}

// Extract visa status
const VISA_PATTERNS: { pattern: RegExp; status: string }[] = [
    { pattern: /\b(us citizen|u\.s\. citizen|united states citizen)\b/i, status: "US Citizen" },
    { pattern: /\b(green card|gc|permanent resident)\b/i, status: "Green Card" },
    { pattern: /\bh[- ]?1b\b/i, status: "H1B" },
    { pattern: /\bh[- ]?4\s*(ead)?\b/i, status: "H4 EAD" },
    { pattern: /\bl[- ]?1\b/i, status: "L1" },
    { pattern: /\bl[- ]?2\s*(ead)?\b/i, status: "L2 EAD" },
    { pattern: /\b(opt|f[- ]?1)\b/i, status: "OPT/F1" },
    { pattern: /\bcpt\b/i, status: "CPT" },
    { pattern: /\b(tn visa|tn)\b/i, status: "TN Visa" },
    { pattern: /\b(ead|employment authorization)\b/i, status: "EAD" },
];

function extractVisaStatus(text: string): string {
    for (const { pattern, status } of VISA_PATTERNS) {
        if (pattern.test(text)) return status;
    }
    return "";
}

// Extract job title
const TITLE_PATTERNS = [
    /(?:current|present|latest|recent)?\s*(?:title|position|role|designation)\s*[:\-]?\s*(.+)/i,
    /^((?:senior|sr|jr|junior|lead|principal|staff|chief)?\s*(?:software|full[- ]?stack|front[- ]?end|back[- ]?end|devops|data|cloud|mobile|web|qa|test|ui\/ux|product|project|program|business|systems?|network|database|security|infrastructure|solutions?|technical|application|enterprise)\s*(?:engineer|developer|architect|analyst|manager|consultant|administrator|specialist|designer|scientist|lead|director|tester|admin))/im,
];

function extractTitle(text: string): string {
    for (const pattern of TITLE_PATTERNS) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const title = match[1].trim().slice(0, 80);
            if (title.length > 3) return title;
        }
    }
    return "";
}

// Extract location
function extractLocation(text: string): string {
    // Look for City, State patterns
    const patterns = [
        /(?:location|address|city|based in|residing)\s*[:\-]?\s*([A-Za-z\s]+,\s*[A-Z]{2})/i,
        /([A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5})/,
        /([A-Za-z\s]+,\s*(?:Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming))/i,
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) return match[1].trim().slice(0, 60);
    }
    return "";
}

// Estimate years of experience
function extractExperienceYears(text: string): number {
    const patterns = [
        /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i,
        /(?:experience|exp)\s*[:\-]?\s*(\d+)\+?\s*(?:years?|yrs?)/i,
        /(\d+)\+?\s*(?:years?|yrs?)\s*(?:in|of)\s*(?:it|software|development|engineering)/i,
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const years = parseInt(match[1], 10);
            if (years > 0 && years < 50) return years;
        }
    }
    return 0;
}

// Generate keywords for search
function generateKeywords(data: { skills: string; title: string; visa: string; location: string }): string {
    const parts = [data.skills, data.title, data.visa, data.location].filter(Boolean);
    return parts.join(" ").toLowerCase();
}

// Main parser function
export async function parseResume(buffer: Buffer, filename: string): Promise<ParsedResume> {
    const ext = filename.toLowerCase().split(".").pop() || "";
    let text = "";

    if (ext === "pdf") {
        text = await parsePDF(buffer);
    } else if (["docx", "doc"].includes(ext)) {
        text = await parseDocx(buffer);
    } else {
        // Try as plain text
        text = buffer.toString("utf-8");
    }

    // Clean up text
    text = text.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();

    const candidate_name = extractName(text);
    const email = extractEmails(text);
    const phone = extractPhones(text);
    const skills = extractSkills(text);
    const current_title = extractTitle(text);
    const location = extractLocation(text);
    const visa_status = extractVisaStatus(text);
    const experience_years = extractExperienceYears(text);
    const keywords = generateKeywords({ skills, title: current_title, visa: visa_status, location });

    return {
        text: text.slice(0, 50000), // Limit storage size
        candidate_name,
        email,
        phone,
        skills,
        current_title,
        location,
        visa_status,
        experience_years,
        keywords,
    };
}
