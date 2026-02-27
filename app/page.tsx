"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ── TYPES ── */
interface MatchResult {
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

interface ResumeDetail {
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
}

/* ── ICONS ── */
const Icons = {
    upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>,
    search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>,
    eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>,
    whatsapp: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.82 14.01c-.24.68-1.43 1.33-1.97 1.37-.51.04-.97.24-3.27-.68-2.77-1.1-4.54-3.93-4.68-4.11-.14-.18-1.1-1.47-1.1-2.8 0-1.34.69-2 .95-2.27.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.24.55.8 1.97.87 2.11.07.14.12.31.02.5-.1.18-.14.3-.28.46-.14.16-.3.35-.42.48-.14.14-.29.3-.12.58.17.28.74 1.22 1.58 1.97 1.09.97 2 1.27 2.29 1.41.28.14.45.12.62-.07.17-.2.71-.83.9-1.12.18-.28.37-.24.62-.14.25.1 1.59.75 1.86.89.28.14.46.2.53.32.07.11.07.66-.17 1.34Z" /></svg>,
    location: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>,
    visa: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" /></svg>,
    experience: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>,
    empty: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>,
    loading: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 3v3m6.364-.636-2.121 2.121M21 12h-3m.636 6.364-2.121-2.121M12 21v-3m-6.364.636 2.121-2.121M3 12h3m-.636-6.364 2.121 2.121" /></svg>,
};

/* ── MAIN APP ── */
export default function Home() {
    const [totalResumes, setTotalResumes] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("");
    const [dragOver, setDragOver] = useState(false);

    const [jobDesc, setJobDesc] = useState("");
    const [visa, setVisa] = useState("");
    const [location, setLocation] = useState("");
    const [minExp, setMinExp] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<MatchResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const [preview, setPreview] = useState<ResumeDetail | null>(null);

    const fileRef = useRef<HTMLInputElement>(null);

    // Fetch total count on load
    useEffect(() => {
        fetch("/api/upload").then(r => r.json()).then(d => setTotalResumes(d.totalResumes || 0)).catch(() => { });
    }, []);

    // Upload handler
    const handleUpload = useCallback(async (files: FileList | File[]) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setUploadProgress(0);
        setUploadStatus(`Uploading ${files.length} file(s)...`);

        const formData = new FormData();
        for (const f of Array.from(files)) {
            const ext = f.name.split(".").pop()?.toLowerCase();
            if (["pdf", "doc", "docx"].includes(ext || "")) {
                formData.append("files", f);
            }
        }

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(p => Math.min(p + 10, 90));
            }, 200);

            const res = await fetch("/api/upload", { method: "POST", body: formData });
            clearInterval(progressInterval);

            if (res.ok) {
                const data = await res.json();
                setUploadProgress(100);
                const success = data.results?.filter((r: { status: string }) => r.status === "success").length || 0;
                setUploadStatus(`✓ ${success}/${files.length} resumes parsed successfully`);
                setTotalResumes(data.totalResumes || 0);
            } else {
                setUploadStatus("✗ Upload failed. Try again.");
            }
        } catch {
            setUploadStatus("✗ Upload error. Check connection.");
        } finally {
            setUploading(false);
            setTimeout(() => { setUploadProgress(0); setUploadStatus(""); }, 4000);
        }
    }, []);

    // Search handler
    async function handleSearch() {
        if (!jobDesc.trim() || jobDesc.trim().length < 10) return;
        setSearching(true);
        setHasSearched(true);
        try {
            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobDescription: jobDesc,
                    visa: visa || undefined,
                    location: location || undefined,
                    minExperience: minExp ? Number(minExp) : undefined,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
            }
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }

    // Preview handler
    async function openPreview(id: number) {
        try {
            const res = await fetch(`/api/resume?id=${id}`);
            if (res.ok) {
                const data = await res.json();
                setPreview(data);
            }
        } catch { /* ignore */ }
    }

    // WhatsApp share
    function shareWhatsApp(r: MatchResult) {
        const text = encodeURIComponent(
            `🎯 *RecruitIQ Match — ${r.match_score}%*\n\n` +
            `*Candidate:* ${r.candidate_name}\n` +
            `*Title:* ${r.current_title || "N/A"}\n` +
            `*Skills:* ${r.skills || "N/A"}\n` +
            `*Location:* ${r.location || "N/A"}\n` +
            `*Visa:* ${r.visa_status || "N/A"}\n` +
            `*Experience:* ${r.experience_years || "N/A"} years\n` +
            `*Email:* ${r.email || "N/A"}\n` +
            `*Phone:* ${r.phone || "N/A"}\n\n` +
            `*Match Reason:* ${r.match_reason}`
        );
        window.open(`https://wa.me/919032247068?text=${text}`, "_blank");
    }

    function getScoreClass(score: number) {
        if (score >= 70) return "score-high";
        if (score >= 40) return "score-mid";
        return "score-low";
    }

    return (
        <div className="app">
            {/* ── TOPBAR ── */}
            <header className="topbar">
                <div className="logo">
                    <div className="logo-mark">RQ</div>
                    <span className="logo-text">Recruit<span className="logo-accent">IQ</span></span>
                </div>
                <div className="topbar-stats">
                    <div className="topbar-stat">
                        <span>Database:</span>
                        <strong>{totalResumes.toLocaleString()}</strong>
                        <span>resumes</span>
                    </div>
                </div>
            </header>

            {/* ── MAIN ── */}
            <div className="main-grid">

                {/* ── LEFT: Upload + Search ── */}
                <div>
                    {/* Upload Panel */}
                    <div className="panel">
                        <div className="panel-header">
                            <h2>📄 Upload Resumes</h2>
                            <span className="badge">PDF / Word</span>
                        </div>
                        <div className="panel-body">
                            <div
                                className={`upload-zone${dragOver ? " dragover" : ""}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
                                onClick={() => fileRef.current?.click()}
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => e.target.files && handleUpload(e.target.files)}
                                />
                                <div className="upload-icon">{Icons.upload}</div>
                                <div className="upload-title">Drop resumes here or click to browse</div>
                                <div className="upload-sub">Supports PDF, DOC, DOCX — upload multiple files at once</div>
                            </div>
                            {(uploading || uploadProgress > 0) && (
                                <div className="upload-progress">
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                    <div className="upload-status">{uploadStatus}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search Panel */}
                    <div className="panel" style={{ marginTop: 20 }}>
                        <div className="panel-header">
                            <h2>🔍 Find Matches</h2>
                            <span className="badge">AI-Powered</span>
                        </div>
                        <div className="panel-body">
                            <div className="search-label">Paste Job Description</div>
                            <textarea
                                className="search-textarea"
                                placeholder={"Example: Looking for a Senior Java Developer with 8+ years experience in Spring Boot, Microservices, AWS. Must have H1B visa. Location: Dallas, TX."}
                                value={jobDesc}
                                onChange={(e) => setJobDesc(e.target.value)}
                            />

                            <div className="search-label" style={{ marginTop: 14 }}>Optional Filters</div>
                            <div className="filters-row">
                                <input className="filter-input" placeholder="Visa (e.g. H1B, GC)" value={visa} onChange={(e) => setVisa(e.target.value)} />
                                <input className="filter-input" placeholder="Location (e.g. Dallas)" value={location} onChange={(e) => setLocation(e.target.value)} />
                                <input className="filter-input" type="number" placeholder="Min. Exp (yrs)" value={minExp} onChange={(e) => setMinExp(e.target.value)} />
                            </div>

                            <button
                                className="search-btn"
                                onClick={handleSearch}
                                disabled={searching || jobDesc.trim().length < 10}
                            >
                                {searching ? (
                                    <><span className="spinner">{Icons.loading}</span> Matching...</>
                                ) : (
                                    <>{Icons.search} Find Top Matches</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Results ── */}
                <div className="panel" style={{ minHeight: 400 }}>
                    <div className="panel-header">
                        <h2>🎯 Match Results</h2>
                        {results.length > 0 && <span className="badge">{results.length} found</span>}
                    </div>

                    {!hasSearched && (
                        <div className="results-empty">
                            <div className="results-empty-icon">{Icons.empty}</div>
                            <h3>Upload resumes &amp; search</h3>
                            <p>Paste a job description to find the best matching candidates from your database.</p>
                        </div>
                    )}

                    {hasSearched && results.length === 0 && !searching && (
                        <div className="results-empty">
                            <div className="results-empty-icon">{Icons.search}</div>
                            <h3>No matches found</h3>
                            <p>Try broadening your search terms or uploading more resumes.</p>
                        </div>
                    )}

                    {searching && (
                        <div className="results-empty">
                            <div className="results-empty-icon"><span className="spinner">{Icons.loading}</span></div>
                            <h3>Analyzing resumes...</h3>
                            <p>AI is scoring and ranking candidates. This takes 5-15 seconds.</p>
                        </div>
                    )}

                    {results.map((r) => (
                        <div className="result-item" key={r.id}>
                            <div className="result-top">
                                <div className={`result-score ${getScoreClass(r.match_score)}`}>
                                    {r.match_score}%
                                </div>
                                <div className="result-info">
                                    <div className="result-name">{r.candidate_name || "Unknown"}</div>
                                    <div className="result-title">{r.current_title || "No title extracted"}</div>
                                </div>
                                <div className="result-actions">
                                    <button className="action-btn" onClick={() => openPreview(r.id)} title="Preview resume">{Icons.eye}</button>
                                    <button className="action-btn" onClick={() => shareWhatsApp(r)} title="Share via WhatsApp" style={{ color: "#25D366" }}>{Icons.whatsapp}</button>
                                </div>
                            </div>
                            <div className="result-meta">
                                {r.location && <span className="meta-tag">{Icons.location} {r.location}</span>}
                                {r.visa_status && <span className="meta-tag">{Icons.visa} {r.visa_status}</span>}
                                {r.experience_years > 0 && <span className="meta-tag">{Icons.experience} {r.experience_years} yrs</span>}
                                {r.email && <span className="meta-tag">✉ {r.email}</span>}
                                {r.phone && <span className="meta-tag">☎ {r.phone}</span>}
                            </div>
                            {r.match_reason && <div className="result-reason">{r.match_reason}</div>}
                            {r.skills && (
                                <div className="result-skills">
                                    {r.skills.split(", ").slice(0, 10).map(s => <span className="skill-tag" key={s}>{s}</span>)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── PREVIEW MODAL ── */}
            {preview && (
                <div className="modal-overlay" onClick={() => setPreview(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📋 {preview.candidate_name || preview.filename}</h3>
                            <button className="modal-close" onClick={() => setPreview(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div className="modal-field"><div className="modal-field-label">Email</div><div className="modal-field-value">{preview.email || "—"}</div></div>
                                <div className="modal-field"><div className="modal-field-label">Phone</div><div className="modal-field-value">{preview.phone || "—"}</div></div>
                                <div className="modal-field"><div className="modal-field-label">Location</div><div className="modal-field-value">{preview.location || "—"}</div></div>
                                <div className="modal-field"><div className="modal-field-label">Visa Status</div><div className="modal-field-value">{preview.visa_status || "—"}</div></div>
                                <div className="modal-field"><div className="modal-field-label">Current Title</div><div className="modal-field-value">{preview.current_title || "—"}</div></div>
                                <div className="modal-field"><div className="modal-field-label">Experience</div><div className="modal-field-value">{preview.experience_years || 0} years</div></div>
                            </div>
                            <div className="modal-field"><div className="modal-field-label">Skills</div><div className="modal-field-value">{preview.skills || "—"}</div></div>
                            <div className="modal-field">
                                <div className="modal-field-label">Resume Text</div>
                                <div className="modal-resume-text">{preview.full_text || "No text extracted"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
