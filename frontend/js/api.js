// ==========================================
// API LAYER — single source of truth for
// the backend base URL and all fetch calls.
// ==========================================

const API_BASE = "http://127.0.0.1:5000";
const SERVER_DOWN_MSG = "Unable to reach the server. Please check your connection and try again.";

// ── Auth ──────────────────────────────────────────────────────────────────────

async function apiLogin(email, password) {
    const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    return { ok: response.ok, status: response.status, data: await response.json() };
}

async function apiSignup(email, password, username, role = "parent") {
    const response = await fetch(`${API_BASE}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, role })
    });
    return { ok: response.ok, status: response.status, data: await response.json() };
}

// ── Questionnaire ─────────────────────────────────────────────────────────────

async function apiSubmitQuestionnaire(answers, email, age_months) {
    const response = await fetch(`${API_BASE}/submit-questionnaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, email, age_months })
    });
    return { ok: response.ok, status: response.status, data: await response.json() };
}

// ── Results ───────────────────────────────────────────────────────────────────

async function apiGetResults(email) {
    const response = await fetch(`${API_BASE}/api/results?email=${encodeURIComponent(email)}`);
    return { ok: response.ok, status: response.status, data: await response.json() };
}

async function apiDeleteResult(resultId) {
    const response = await fetch(`${API_BASE}/api/results/${resultId}`, { method: "DELETE" });
    return { ok: response.ok, status: response.status };
}

async function apiPurgeUserData(email, delete_account = false) {
    const response = await fetch(`${API_BASE}/api/purge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, delete_account })
    });
    return { ok: response.ok, status: response.status, data: await response.json() };
}

// ── Doctors ───────────────────────────────────────────────────────────────────

async function apiGetDoctors() {
    const response = await fetch(`${API_BASE}/api/doctors`);
    return { ok: response.ok, status: response.status, data: await response.json() };
}

async function apiGetDoctorProfile(email) {
    const response = await fetch(`${API_BASE}/api/doctors/${encodeURIComponent(email)}`);
    return { ok: response.ok, status: response.status, data: await response.json() };
}

async function apiUpdateDoctorProfile(profileData) {
    const response = await fetch(`${API_BASE}/api/doctors/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
    });
    return { ok: response.ok, status: response.status, data: await response.json() };
}

async function apiRateDoctor(doctor_email, parent_email, score, comment = "") {
    const response = await fetch(`${API_BASE}/api/doctors/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_email, parent_email, score, comment })
    });
    return { ok: response.ok, status: response.status, data: await response.json() };
}

async function apiGetPatients() {
    const response = await fetch(`${API_BASE}/api/patients`);
    return { ok: response.ok, status: response.status, data: await response.json() };
}

// ── Milestones ────────────────────────────────────────────────────────────────

async function apiGetMilestones(email) {
    const response = await fetch(`${API_BASE}/api/milestones?email=${encodeURIComponent(email)}`);
    return { ok: response.ok, status: response.status, data: await response.json() };
}

async function apiSaveMilestones(payload) {
    const response = await fetch(`${API_BASE}/api/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    return { ok: response.ok, status: response.status, data: await response.json() };
}

async function apiGetPatientMilestones(email) {
    const response = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(email)}/milestones`);
    return { ok: response.ok, status: response.status, data: await response.json() };
}