// ==========================================
// DOCTOR DASHBOARD — Charts + Patient Table
// ==========================================

let allPatients = [];
let charts = { pie: null, bar: null, hist: null };
let modalCharts = { doughnut: null, bar: null };

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
    ["doughnut","bar"].forEach(k => { if (modalCharts[k]) { modalCharts[k].destroy(); modalCharts[k] = null; } });
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
        tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No patient records found.</td></tr>';
        return;
    }
    tbody.innerHTML = patients.map(p => `
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
            <td style="text-align:center;">${p.last_flags != null ? p.last_flags : "—"}</td>
            <td>${riskBadge(p.last_likelihood)}</td>
        </tr>
    `).join("");
}

function filterPatients(query) {
    const q = query.toLowerCase();
    renderPatientTable(allPatients.filter(p =>
        p.email.toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
    ));
}

// ── Patient Modal ─────────────────────────────────────────────
function openPatientModal(p) {
    document.getElementById("modal-patient-name").innerText = p.username;
    document.getElementById("modal-patient-email").innerText = p.email;
    document.getElementById("modal-interpretation").innerText = p.last_interpretation || "No screening data available.";

    // Metrics
    document.getElementById("modal-metrics").innerHTML = `
        <div class="stat-card" style="padding:16px;">
            <div class="stat-card-value" style="font-size:24px; color:${likelihoodColor(p.last_likelihood)};">
                ${p.last_likelihood != null ? p.last_likelihood + "%" : "—"}
            </div>
            <div class="stat-card-label">Likelihood</div>
        </div>
        <div class="stat-card" style="padding:16px;">
            <div class="stat-card-value" style="font-size:24px; color:#d4a017;">${p.last_flags != null ? p.last_flags : "—"}</div>
            <div class="stat-card-label">Critical Flags</div>
        </div>
        <div class="stat-card" style="padding:16px;">
            <div class="stat-card-value" style="font-size:24px;">${p.total_screenings}</div>
            <div class="stat-card-label">Screenings</div>
        </div>
    `;

    document.getElementById("patient-modal").classList.remove("hidden");

    // Destroy old modal charts
    destroyModalCharts();
    const CD = getCD();

    const social = p.last_social || 0;
    const behavioral = p.last_behavioral || 0;
    const other = Math.max(0, 100 - social - behavioral);

    // Doughnut — domain share
    modalCharts.doughnut = new Chart(document.getElementById("modalDoughnutChart").getContext("2d"), {
        type: "doughnut",
        data: { labels: ["Social","Behavioral","Other"],
                datasets: [{ data: [social, behavioral, other],
                             backgroundColor: ["rgba(200,200,200,.65)","rgba(212,160,23,.65)","rgba(100,100,100,.4)"],
                             borderColor: CD.border, borderWidth: 2 }] },
        options: { responsive:true, maintainAspectRatio:true, cutout:"55%",
                   plugins: { legend: { position:"bottom", labels: { color:CD.color, font:CD.font, padding:10 } } } }
    });

    // Bar — scores vs max
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
