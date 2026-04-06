// ==========================================
// DOCTOR DASHBOARD — Charts + Patient Table + Full Analytics
// ==========================================

let allPatients = [];
let charts = { pie: null, bar: null, hist: null };
let modalCharts = { doughnut: null, bar: null, trend: null, msDonut: null, msCat: null, msAge: null };

// Milestone constants (mirrors parent milestones.js)
const AGE_GROUPS = [2, 4, 6, 9, 12, 18, 24, 36, 48, 60];
const AGE_LABELS = {2:"2 Months",4:"4 Months",6:"6 Months",9:"9 Months",12:"1 Year",18:"18 Months",24:"2 Years",36:"3 Years",48:"4 Years",60:"5 Years"};
const CAT_LABELS = {social:"Social / Emotional",language:"Language / Communication",cognitive:"Cognitive",movement:"Movement / Physical"};
const STATUS_LABELS = {not_yet:"Not Yet", emerging:"Emerging", achieved:"Achieved"};
const STATUS_COLORS = {not_yet:"#a0a0a0", emerging:"#d4a017", achieved:"#2e7d32"};

// ── Auth Guard ────────────────────────────────────────────────────────────────
const _docUser = (function() {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user || user.role !== "doctor") {
        window.location.replace("login.html");
        return null;
    }
    const name = user.username || user.email.split("@")[0];
    document.addEventListener("DOMContentLoaded", () => {
        const el = document.getElementById("greetingText");
        if (el) el.innerText = `Hi, ${name}`;
        const av = document.getElementById("avatarLetter");
        if (av) av.innerText = name.charAt(0).toUpperCase();
    });
    return user;
})();

// ── Sidebar ─────────────────────────────────────────────────
function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}
function scrollToPatients(e) {
    e.preventDefault();
    document.getElementById("patients-section").scrollIntoView({ behavior: "smooth" });
}

// ── Formatters ───────────────────────────────────────────────
function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function riskBadge(v) {
    if (v === null || v === undefined) return '<span class="risk-badge risk-none">No Data</span>';
    if (v >= 70) return '<span class="risk-badge risk-high">High</span>';
    if (v >= 35) return '<span class="risk-badge risk-moderate">Moderate</span>';
    return '<span class="risk-badge risk-low">Low</span>';
}
function likelihoodColor(v) {
    if (v === null || v === undefined) return "#a0a0a0";
    if (v >= 70) return "#dc143c";
    if (v >= 35) return "#d4a017";
    return "#2e7d32";
}

// ── Chart defaults ───────────────────────────────────────────
function getCD() {
    const isLight = document.documentElement.classList.contains('light-mode');
    return {
        color: isLight ? "#4a4a4a" : "rgba(255,255,255,0.7)",
        grid: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)",
        border: isLight ? "#ffffff" : "#2b2d31",
        font: { family: "Comfortaa, sans-serif", size: 12 }
    };
}

function destroyCharts() {
    ["pie","bar","hist"].forEach(k => { if (charts[k]) { charts[k].destroy(); charts[k] = null; } });
}
function destroyModalCharts() {
    Object.keys(modalCharts).forEach(k => { if (modalCharts[k]) { modalCharts[k].destroy(); modalCharts[k] = null; } });
}

// ── Stats ────────────────────────────────────────────────────
function computeStats(patients) {
    let totalScreenings = 0, high = 0, mod = 0, low = 0, sum = 0, count = 0;
    patients.forEach(p => {
        totalScreenings += p.total_screenings;
        if (p.last_likelihood != null) {
            count++; sum += p.last_likelihood;
            if (p.last_likelihood >= 70) high++;
            else if (p.last_likelihood >= 35) mod++;
            else low++;
        }
    });
    return { total: patients.length, totalScreenings, high, mod, low,
             avg: count ? (sum / count).toFixed(1) : "—" };
}

function renderStats(s) {
    document.getElementById("stat-total").innerText = s.total;
    document.getElementById("stat-screenings").innerText = s.totalScreenings;
    document.getElementById("stat-highrisk").innerText = s.high;
    document.getElementById("stat-moderate").innerText = s.mod;
    document.getElementById("stat-lowrisk").innerText = s.low;
    document.getElementById("stat-avglikelihood").innerText = s.avg !== "—" ? s.avg + "%" : "—";
}

// ── Global Charts ─────────────────────────────────────────────
function renderCharts(patients) {
    destroyCharts();
    const CD = getCD();
    const screened = patients.filter(p => p.last_likelihood != null);
    const high = screened.filter(p => p.last_likelihood >= 70).length;
    const mod  = screened.filter(p => p.last_likelihood >= 35 && p.last_likelihood < 70).length;
    const low  = screened.filter(p => p.last_likelihood < 35).length;

    // 1. Pie
    charts.pie = new Chart(document.getElementById("riskPieChart").getContext("2d"), {
        type: "doughnut",
        data: { labels: ["High Risk","Moderate Risk","Low Risk"],
                datasets: [{ data: [high,mod,low],
                             backgroundColor: ["#dc143c","#d4a017","#2e7d32"],
                             borderColor: CD.border, borderWidth: 3, hoverOffset: 8 }] },
        options: { responsive: true, maintainAspectRatio: true, cutout: "62%",
                   plugins: { legend: { position: "bottom", labels: { color: CD.color, font: CD.font, padding:16 } } } }
    });

    // 2. Domain bar
    const avg = (arr, key) => arr.length ? (arr.reduce((s,p) => s + (p[key] || 0), 0) / arr.length).toFixed(1) : 0;
    charts.bar = new Chart(document.getElementById("domainBarChart").getContext("2d"), {
        type: "bar",
        data: { labels: ["Social","Behavioral","Flags ×20"],
                datasets: [{ label: "Average", data: [avg(screened,"last_social"), avg(screened,"last_behavioral"), (parseFloat(avg(screened,"last_flags")) * 20).toFixed(1)],
                             backgroundColor: ["rgba(200,200,200,.6)","rgba(212,160,23,.6)","rgba(160,160,160,.5)"],
                             borderColor: ["#ccc","#d4a017","#999"], borderWidth: 2, borderRadius: 8 }] },
        options: { responsive:true, maintainAspectRatio:true, plugins:{legend:{display:false}},
                   scales: { y:{beginAtZero:true,max:100,grid:{color:CD.grid},ticks:{color:CD.color,font:CD.font,callback:v=>v+"%"}},
                             x:{grid:{display:false},ticks:{color:CD.color,font:CD.font,maxRotation:0,minRotation:0}} } }
    });

    // 3. Histogram
    const bins = [0,0,0,0,0];
    screened.forEach(p => bins[Math.min(Math.floor(p.last_likelihood/20), 4)]++);
    charts.hist = new Chart(document.getElementById("likelihoodHistChart").getContext("2d"), {
        type: "bar",
        data: { labels: ["0–20%","20–40%","40–60%","60–80%","80–100%"],
                datasets: [{ label:"Patients", data:bins,
                             backgroundColor: ["#2e7d32","#4a7c2e","#c9a800","#d4a017","#dc143c"],
                             borderColor:CD.border, borderWidth:2, borderRadius:8 }] },
        options: { responsive:true, maintainAspectRatio:true, plugins:{legend:{display:false}},
                   scales: { y:{beginAtZero:true,ticks:{stepSize:1,color:CD.color,font:CD.font},grid:{color:CD.grid}},
                             x:{grid:{display:false},ticks:{color:CD.color,font:CD.font,maxRotation:0,minRotation:0}} } }
    });
}

// ── Patient Table ─────────────────────────────────────────────
function renderPatientTable(patients) {
    const tbody = document.getElementById("patient-tbody");
    if (!patients.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="table-empty">No patient records found.</td></tr>';
        return;
    }
    tbody.innerHTML = patients.map(p => {
        const ms = p.milestone_summary || {};
        const msText = ms.achieved != null ? `${ms.achieved}/${ms.total}` : "—";
        return `
        <tr style="cursor:pointer;" onclick='openPatientModal(${JSON.stringify(p)})'>
            <td>
                <div style="font-weight:600; font-size:13px;">${p.username}</div>
                <div style="color:#a0a0a0; font-size:12px;">${p.email}</div>
            </td>
            <td style="text-align:center;">${p.total_screenings}</td>
            <td>${fmtDate(p.last_screened)}</td>
            <td style="text-align:center; font-weight:700; color:${likelihoodColor(p.last_likelihood)};">
                ${p.last_likelihood != null ? p.last_likelihood + "%" : "—"}
            </td>
            <td style="text-align:center;">${p.last_social != null ? p.last_social + "%" : "—"}</td>
            <td style="text-align:center;">${p.last_behavioral != null ? p.last_behavioral + "%" : "—"}</td>
            <td style="text-align:center;">${msText}</td>
            <td style="text-align:center;">${p.last_flags != null ? p.last_flags : "—"}</td>
            <td>${riskBadge(p.last_likelihood)}</td>
        </tr>
    `;
    }).join("");
}

function filterPatients(query) {
    const q = query.toLowerCase();
    renderPatientTable(allPatients.filter(p =>
        p.email.toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
    ));
}

// ── Patient Modal — Full Analytics ────────────────────────────
async function openPatientModal(p) {
    document.getElementById("modal-patient-name").innerText = p.username;
    document.getElementById("modal-patient-email").innerText = p.email;
    document.getElementById("modal-interpretation").innerText = p.last_interpretation || "No screening data available.";

    // Child info
    const ms = p.milestone_summary || {};
    const childInfo = ms.child_name ? `Child: ${ms.child_name}` + (ms.child_dob ? ` • DOB: ${ms.child_dob}` : "") : "";
    document.getElementById("modal-child-info").innerText = childInfo;

    // Metrics (3-column — milestone details shown in analytics section below)
    document.getElementById("modal-metrics").innerHTML = `
        <div class="stat-card" style="padding:14px;">
            <div class="stat-card-value" style="font-size:22px;">
                <span style="color:${likelihoodColor(p.last_likelihood)};">
                    ${p.last_likelihood != null ? p.last_likelihood + "%" : "—"}
                </span>
            </div>
            <div class="stat-card-label">Likelihood</div>
        </div>
        <div class="stat-card" style="padding:14px;">
            <div class="stat-card-value" style="font-size:22px;">
                <span style="color:#d4a017;">${p.last_flags != null ? p.last_flags : "—"}</span>
            </div>
            <div class="stat-card-label">Critical Flags</div>
        </div>
        <div class="stat-card" style="padding:14px;">
            <div class="stat-card-value" style="font-size:22px;">${p.total_screenings}</div>
            <div class="stat-card-label">Screenings</div>
        </div>
    `;

    document.getElementById("patient-modal").classList.remove("hidden");

    // Destroy old charts
    destroyModalCharts();
    const CD = getCD();

    // ── Domain Doughnut ──
    const social = p.last_social || 0;
    const behavioral = p.last_behavioral || 0;
    const other = Math.max(0, 100 - social - behavioral);

    modalCharts.doughnut = new Chart(document.getElementById("modalDoughnutChart").getContext("2d"), {
        type: "doughnut",
        data: { labels: ["Social","Behavioral","Other"],
                datasets: [{ data: [social, behavioral, other],
                             backgroundColor: ["rgba(200,200,200,.65)","rgba(212,160,23,.65)","rgba(100,100,100,.4)"],
                             borderColor: CD.border, borderWidth: 2 }] },
        options: { responsive:true, maintainAspectRatio:true, cutout:"55%",
                   plugins: { legend: { position:"bottom", labels: { color:CD.color, font:CD.font, padding:10 } } } }
    });

    // ── Score Bar ──
    modalCharts.bar = new Chart(document.getElementById("modalBarChart").getContext("2d"), {
        type: "bar",
        data: { labels: ["Social","Behavioral","Likelihood"],
                datasets: [{ label:"Score", data:[social, behavioral, p.last_likelihood || 0],
                             backgroundColor: ["rgba(200,200,200,.6)","rgba(212,160,23,.6)",`${likelihoodColor(p.last_likelihood)}cc`],
                             borderColor:["#ccc","#d4a017",likelihoodColor(p.last_likelihood)],
                             borderWidth:2, borderRadius:8 }] },
        options: { responsive:true, maintainAspectRatio:true, plugins:{legend:{display:false}},
                   scales: { y:{beginAtZero:true,max:100,grid:{color:CD.grid},ticks:{color:CD.color,font:CD.font,callback:v=>v+"%"}},
                             x:{grid:{display:false},ticks:{color:CD.color,font:CD.font,maxRotation:0,minRotation:0}} } }
    });

    // ── Screening History Table + Trend Chart ──
    const results = (p.results || []).slice().reverse(); // oldest first for chart
    renderScreeningHistory(results, CD);

    // ── Milestone Analytics (async fetch) ──
    document.getElementById("milestone-loading").style.display = "block";
    document.getElementById("milestone-analytics").style.display = "none";

    try {
        const { ok, data } = await apiGetPatientMilestones(p.email);
        if (ok) {
            renderMilestoneAnalytics(data, CD);
        } else {
            document.getElementById("milestone-loading").innerText = "Could not load milestones.";
        }
    } catch (e) {
        document.getElementById("milestone-loading").innerText = "Could not load milestones.";
    }
}

// ── Screening History ─────────────────────────────────────────
function renderScreeningHistory(results, CD) {
    // Table (newest first for display)
    const tbody = document.getElementById("modal-history-tbody");
    if (!results.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No screenings yet.</td></tr>';
    } else {
        const display = [...results].reverse(); // newest first
        tbody.innerHTML = display.map(r => `
            <tr>
                <td>${fmtDate(r.timestamp)}</td>
                <td style="text-align:center; font-weight:700; color:${likelihoodColor(r.likelihood)};">${r.likelihood}%</td>
                <td style="text-align:center;">${r.social_percent}%</td>
                <td style="text-align:center;">${r.behavioral_percent}%</td>
                <td style="text-align:center;">${r.critical_flags}</td>
            </tr>
        `).join("");
    }

    // Trend line chart (oldest→newest)
    if (results.length > 0) {
        const labels = results.map(r => fmtDate(r.timestamp));
        const likelihoods = results.map(r => r.likelihood);
        const socialScores = results.map(r => r.social_percent);

        const isLight = document.documentElement.classList.contains('light-mode');
        modalCharts.trend = new Chart(document.getElementById("modalTrendChart").getContext("2d"), {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Likelihood",
                        data: likelihoods,
                        borderColor: "#dc143c",
                        backgroundColor: "rgba(220,20,60,0.1)",
                        fill: true, tension: 0.3, pointRadius: 4, borderWidth: 2
                    },
                    {
                        label: "Social %",
                        data: socialScores,
                        borderColor: isLight ? "#666" : "#ccc",
                        fill: false, tension: 0.3, pointRadius: 3, borderWidth: 1.5,
                        borderDash: [4, 3]
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: { legend: { position: "bottom", labels: { color: CD.color, font: CD.font, padding: 12 } } },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: CD.grid }, ticks: { color: CD.color, font: CD.font, callback: v => v + "%" } },
                    x: { grid: { display: false }, ticks: { color: CD.color, font: CD.font, maxRotation: 45, minRotation: 20 } }
                }
            }
        });
    }
}

// ── Milestone Analytics ───────────────────────────────────────
function renderMilestoneAnalytics(data, CD) {
    const definitions = data.definitions || [];
    const userMilestones = data.milestones || {};
    const childDob = data.child_dob || "";

    // Calculate child age in months
    let childAgeMonths = null;
    if (childDob) {
        const birth = new Date(childDob);
        const now = new Date();
        childAgeMonths = Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()));
    }

    // Stats
    let achieved = 0, emerging = 0, notYet = 0, delayed = 0;
    // Count all milestones (total 90)
    const relevant = definitions;
    relevant.forEach(d => {
        const status = (userMilestones[d.id] || {}).status || "not_yet";
        const isPast = childAgeMonths !== null && d.age_months < childAgeMonths;
        
        if (status === "achieved") {
            achieved++;
        } else if (isPast) {
            delayed++;
        } else if (status === "emerging") {
            emerging++;
        } else {
            notYet++;
        }
    });

    // Stat cards
    document.getElementById("ms-stat-cards").innerHTML = `
        <div class="stat-card" style="padding:12px;">
            <div class="stat-card-value" style="font-size:20px;">${relevant.length}</div>
            <div class="stat-card-label">Total</div>
        </div>
        <div class="stat-card" style="padding:12px;">
            <div class="stat-card-value stat-ok" style="font-size:20px;">${achieved}</div>
            <div class="stat-card-label">Achieved</div>
        </div>
        <div class="stat-card" style="padding:12px;">
            <div class="stat-card-value stat-warn" style="font-size:20px;">${emerging}</div>
            <div class="stat-card-label">Emerging</div>
        </div>
        <div class="stat-card" style="padding:12px;">
            <div class="stat-card-value stat-danger" style="font-size:20px;">${delayed}</div>
            <div class="stat-card-label">Delayed</div>
        </div>
    `;

    // Donut
    modalCharts.msDonut = new Chart(document.getElementById("msDonutChart").getContext("2d"), {
        type: "doughnut",
        data: {
            labels: ["Achieved", "Emerging", "Not Yet", "Delayed"],
            datasets: [{ data: [achieved, emerging, notYet, delayed],
                         backgroundColor: ["#2e7d32", "#d4a017", "#555", "#dc143c"],
                         borderColor: CD.border, borderWidth: 3, hoverOffset: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: true, cutout: "60%",
                   plugins: { legend: { position: "bottom", labels: { color: CD.color, font: { ...CD.font, size: 10 }, padding: 10 } } } }
    });

    // Category bar
    const categories = ["social", "language", "cognitive", "movement"];
    const catData = categories.map(cat => {
        const catDefs = childAgeMonths !== null
            ? definitions.filter(d => d.category === cat && d.age_months <= childAgeMonths)
            : definitions.filter(d => d.category === cat);
        if (catDefs.length === 0) return 0;
        const ach = catDefs.filter(d => (userMilestones[d.id] || {}).status === "achieved").length;
        return Math.round((ach / catDefs.length) * 100);
    });

    const isLight = document.documentElement.classList.contains('light-mode');
    const catColors = {
        social: isLight ? "#555" : "#ccc",
        language: isLight ? "#888" : "#999",
        cognitive: "#d4a017",
        movement: "#2e7d32"
    };

    modalCharts.msCat = new Chart(document.getElementById("msCategoryChart").getContext("2d"), {
        type: "bar",
        data: {
            labels: ["Social", "Language", "Cognitive", "Movement"],
            datasets: [{ label: "% Complete", data: catData,
                         backgroundColor: [catColors.social, catColors.language, catColors.cognitive, catColors.movement],
                         borderColor: CD.border, borderWidth: 2, borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } },
                   scales: {
                       y: { beginAtZero: true, max: 100, grid: { color: CD.grid }, ticks: { color: CD.color, font: { ...CD.font, size: 10 }, callback: v => v + "%" } },
                       x: { grid: { display: false }, ticks: { color: CD.color, font: { ...CD.font, size: 10 } } }
                   } }
    });

    // Age progress line
    const ageLabels = AGE_GROUPS.map(a => AGE_LABELS[a]);
    const actualPct = AGE_GROUPS.map(age => {
        const group = definitions.filter(d => d.age_months === age);
        if (group.length === 0) return 0;
        const ach = group.filter(d => (userMilestones[d.id] || {}).status === "achieved").length;
        return Math.round((ach / group.length) * 100);
    });
    const expectedPct = AGE_GROUPS.map(age => {
        if (childAgeMonths === null) return 100;
        return childAgeMonths >= age ? 100 : 0;
    });

    modalCharts.msAge = new Chart(document.getElementById("msAgeChart").getContext("2d"), {
        type: "line",
        data: {
            labels: ageLabels,
            datasets: [
                {
                    label: "Actual",
                    data: actualPct,
                    borderColor: isLight ? "#666" : "#ccc",
                    backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(200,200,200,0.15)",
                    fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2
                },
                {
                    label: "Expected",
                    data: expectedPct,
                    borderColor: "#a0a0a0",
                    borderDash: [6, 4],
                    fill: false, tension: 0, pointRadius: 0, borderWidth: 1.5
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { position: "bottom", labels: { color: CD.color, font: { ...CD.font, size: 10 }, padding: 10 } } },
            scales: {
                y: { beginAtZero: true, max: 100, grid: { color: CD.grid }, ticks: { color: CD.color, font: { ...CD.font, size: 10 }, callback: v => v + "%" } },
                x: { grid: { display: false }, ticks: { color: CD.color, font: { ...CD.font, size: 9 }, maxRotation: 45, minRotation: 20 } }
            }
        }
    });

    // Milestone accordion (read-only)
    renderMilestoneAccordion(definitions, userMilestones, childAgeMonths);

    // Show analytics, hide loading
    document.getElementById("milestone-loading").style.display = "none";
    document.getElementById("milestone-analytics").style.display = "block";
}

// ── Read-Only Milestone Accordion ─────────────────────────────
function renderMilestoneAccordion(definitions, userMilestones, childAgeMonths) {
    const container = document.getElementById("ms-accordion");
    container.innerHTML = "";

    AGE_GROUPS.forEach(age => {
        const group = definitions.filter(d => d.age_months === age);
        if (group.length === 0) return;

        const achieved = group.filter(d => (userMilestones[d.id] || {}).status === "achieved").length;
        const pct = Math.round((achieved / group.length) * 100);

        const section = document.createElement("div");
        section.className = "milestone-section";
        section.innerHTML = `
            <div class="milestone-section-header" onclick="this.parentElement.classList.toggle('open')">
                <div style="display:flex; align-items:center; gap:12px;">
                    <span class="milestone-age-badge">${AGE_LABELS[age]}</span>
                </div>
                <div style="display:flex; align-items:center; gap:16px;">
                    <span style="font-size:13px; color:#a0a0a0;">${achieved}/${group.length}</span>
                    <div class="milestone-progress-mini">
                        <div class="milestone-progress-fill" style="width:${pct}%; background:${pct === 100 ? '#2e7d32' : pct > 0 ? '#d4a017' : '#555'};"></div>
                    </div>
                    <svg class="milestone-chevron" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
                </div>
            </div>
            <div class="milestone-section-body">
                ${group.map(d => {
                    const data = userMilestones[d.id] || { status: "not_yet", notes: "" };
                    const status = data.status || "not_yet";
                    const isDelayed = status !== "achieved" && childAgeMonths !== null && d.age_months < childAgeMonths;
                    return `
                        <div class="milestone-card ${isDelayed ? 'delayed' : ''}" style="cursor:default;">
                            <div class="milestone-card-top">
                                <div style="display:flex; align-items:center; gap:10px; flex:1;">
                                    <span class="milestone-cat-label" style="color:${STATUS_COLORS[status]}; font-size:10px;">${CAT_LABELS[d.category]}</span>
                                    ${isDelayed ? '<span class="milestone-delay-badge">Delayed</span>' : ''}
                                </div>
                                <span style="font-size:12px; font-weight:600; color:${STATUS_COLORS[status]};">${STATUS_LABELS[status]}</span>
                            </div>
                            <p class="milestone-text" style="font-size:13px; margin:6px 0 0;">${d.text}</p>
                            ${data.notes ? `<p style="font-size:11px; color:#a0a0a0; margin:4px 0 0; font-style:italic;">${data.notes}</p>` : ""}
                        </div>
                    `;
                }).join("")}
            </div>
        `;
        section.classList.add("open"); // auto-open all in doctor read-only view
        container.appendChild(section);
    });
}

function closePatientModal() {
    document.getElementById("patient-modal").classList.add("hidden");
    destroyModalCharts();
}

// ── Main Load ─────────────────────────────────────────────────
async function loadDashboard() {
    try {
        const { ok, data } = await apiGetPatients();
        if (!ok) { console.error("Failed to load patients"); return; }
        allPatients = data.patients || [];
        renderStats(computeStats(allPatients));
        renderCharts(allPatients);
        renderPatientTable(allPatients);
    } catch (err) {
        console.error("Dashboard load error:", err);
    }
}

// Close modal on outside click
document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    document.getElementById("patient-modal").addEventListener("click", function(e) {
        if (e.target === this) closePatientModal();
    });
});
