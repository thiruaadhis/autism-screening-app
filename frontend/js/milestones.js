// ==========================================
// MILESTONES TRACKER — CDC Developmental
// ==========================================

let userEmail = "";
let definitions = [];
let userMilestones = {};   // { milestoneId: {status, notes} }
let childAgeMonths = null;

// Chart instances
let donutChart = null, categoryChart = null, ageChart = null;

const AGE_GROUPS = [2, 4, 6, 9, 12, 18, 24, 36, 48, 60];
const AGE_LABELS = {2:"2 Months",4:"4 Months",6:"6 Months",9:"9 Months",12:"1 Year",18:"18 Months",24:"2 Years",36:"3 Years",48:"4 Years",60:"5 Years"};
const CAT_LABELS = {social:"Social / Emotional",language:"Language / Communication",cognitive:"Cognitive",movement:"Movement / Physical"};
const getCatColors = () => {
    const isLight = document.body.classList.contains("light-mode");
    return { social: isLight ? "#555" : "#ccc", language: isLight ? "#888" : "#999", cognitive: "#d4a017", movement: "#2e7d32" };
};
const STATUS_CYCLE = ["not_yet", "emerging", "achieved"];
const STATUS_LABELS = {not_yet:"Not Yet", emerging:"Emerging", achieved:"Achieved"};
const STATUS_COLORS = {not_yet:"#a0a0a0", emerging:"#d4a017", achieved:"#2e7d32"};

// ── Init ─────────────────────────────────────────────────────────────────────
(function() {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user) { window.location.replace("login.html"); return; }
    userEmail = user.email;
})();

document.addEventListener("DOMContentLoaded", async () => {
    await loadData();
    document.getElementById("child-dob").addEventListener("change", () => {
        updateAgeDisplay();
        renderAll();
    });
});

// ── Data I/O ─────────────────────────────────────────────────────────────────
async function loadData() {
    try {
        const { ok, data } = await apiGetMilestones(userEmail);
        if (!ok) return;

        definitions = data.definitions || [];
        userMilestones = data.milestones || {};

        if (data.child_name) document.getElementById("child-name").value = data.child_name;
        if (data.child_dob) document.getElementById("child-dob").value = data.child_dob;

        updateAgeDisplay();
        renderAll();
    } catch (e) {
        console.error("Milestone load error:", e);
    }
}

async function saveData() {
    const msgEl = document.getElementById("save-msg");
    msgEl.style.display = "none";

    const payload = {
        email: userEmail,
        child_name: document.getElementById("child-name").value.trim(),
        child_dob: document.getElementById("child-dob").value,
        milestones: userMilestones
    };

    try {
        const { ok } = await apiSaveMilestones(payload);
        msgEl.innerText = ok ? "✓ Milestones saved!" : "Failed to save.";
        msgEl.style.color = ok ? "#2e7d32" : "#dc143c";
        msgEl.style.background = ok ? "rgba(46,125,50,0.1)" : "rgba(220,20,60,0.1)";
        msgEl.style.border = `1px solid ${ok ? "#2e7d32" : "#dc143c"}`;
        msgEl.style.display = "block";
        setTimeout(() => { msgEl.style.display = "none"; }, 3000);
    } catch (e) {
        msgEl.innerText = SERVER_DOWN_MSG;
        msgEl.style.color = "#dc143c";
        msgEl.style.background = "rgba(220,20,60,0.1)";
        msgEl.style.border = "1px solid #dc143c";
        msgEl.style.display = "block";
    }
}

// ── Age Calculation ──────────────────────────────────────────────────────────
function updateAgeDisplay() {
    const dob = document.getElementById("child-dob").value;
    const el = document.getElementById("child-age-display");
    if (!dob) { childAgeMonths = null; el.innerText = "—"; return; }

    const birth = new Date(dob);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    childAgeMonths = Math.max(0, months);

    if (childAgeMonths < 12) {
        el.innerText = `${childAgeMonths} month${childAgeMonths !== 1 ? "s" : ""}`;
    } else {
        const y = Math.floor(childAgeMonths / 12);
        const m = childAgeMonths % 12;
        el.innerText = `${y}y ${m}m (${childAgeMonths}mo)`;
    }
}

// ── Main Render ──────────────────────────────────────────────────────────────
function renderAll() {
    renderStats();
    renderCharts();
    renderAccordion();
}

// ── Stats ────────────────────────────────────────────────────────────────────
function getStats() {
    // Only count milestones relevant to child's age (or all if no DOB)
    const relevant = childAgeMonths !== null
        ? definitions.filter(d => d.age_months <= childAgeMonths)
        : definitions;

    let achieved = 0, emerging = 0, notYet = 0, delayed = 0;
    relevant.forEach(d => {
        const status = (userMilestones[d.id] || {}).status || "not_yet";
        if (status === "achieved") achieved++;
        else if (status === "emerging") emerging++;
        else {
            notYet++;
            if (childAgeMonths !== null && d.age_months < childAgeMonths) delayed++;
        }
    });
    return { total: relevant.length, achieved, emerging, notYet, delayed };
}

function renderStats() {
    const s = getStats();
    document.getElementById("stat-total").innerText = s.total;
    document.getElementById("stat-achieved").innerText = s.achieved;
    document.getElementById("stat-emerging").innerText = s.emerging;
    document.getElementById("stat-delayed").innerText = s.delayed;
}

// ── Charts ───────────────────────────────────────────────────────────────────
function chartDefaults() {
    const isLight = document.body.classList.contains("light-mode");
    return {
        color: isLight ? "#1e1f22" : "#eaeaea",
        grid: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
        border: isLight ? "#e0e0e0" : "#232428",
        font: { family: "'Comfortaa', sans-serif", size: 11 }
    };
}

function renderCharts() {
    const s = getStats();
    const CD = chartDefaults();

    // ── Donut ─────────────────────────────────────
    if (donutChart) donutChart.destroy();
    donutChart = new Chart(document.getElementById("chart-donut"), {
        type: "doughnut",
        data: {
            labels: ["Achieved", "Emerging", "Not Yet"],
            datasets: [{
                data: [s.achieved, s.emerging, s.notYet],
                backgroundColor: ["#2e7d32", "#d4a017", "#555"],
                borderColor: CD.border, borderWidth: 3, hoverOffset: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true, cutout: "62%",
            plugins: { legend: { position: "bottom", labels: { color: CD.color, font: CD.font, padding: 16 } } }
        }
    });

    // ── Category Bar Chart ────────────────────────
    const categories = ["social", "language", "cognitive", "movement"];
    const catData = categories.map(cat => {
        const relevant = childAgeMonths !== null
            ? definitions.filter(d => d.category === cat && d.age_months <= childAgeMonths)
            : definitions.filter(d => d.category === cat);
        if (relevant.length === 0) return 0;
        const achieved = relevant.filter(d => (userMilestones[d.id] || {}).status === "achieved").length;
        return Math.round((achieved / relevant.length) * 100);
    });

    const catColors = getCatColors();
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(document.getElementById("chart-category"), {
        type: "bar",
        data: {
            labels: ["Social", "Language", "Cognitive", "Movement"],
            datasets: [{
                label: "% Complete",
                data: catData,
                backgroundColor: [catColors.social, catColors.language, catColors.cognitive, catColors.movement],
                borderColor: CD.border, borderWidth: 2, borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 100, grid: { color: CD.grid }, ticks: { color: CD.color, font: CD.font, callback: v => v + "%" } },
                x: { grid: { display: false }, ticks: { color: CD.color, font: CD.font } }
            }
        }
    });

    // ── Age Progress Line Chart ──────────────────
    const ageLabels = AGE_GROUPS.map(a => AGE_LABELS[a]);
    const actualPct = AGE_GROUPS.map(age => {
        const group = definitions.filter(d => d.age_months === age);
        if (group.length === 0) return 0;
        const achieved = group.filter(d => (userMilestones[d.id] || {}).status === "achieved").length;
        return Math.round((achieved / group.length) * 100);
    });
    const expectedPct = AGE_GROUPS.map(age => {
        if (childAgeMonths === null) return 100;
        return childAgeMonths >= age ? 100 : 0;
    });

    const isLight = document.body.classList.contains("light-mode");
    if (ageChart) ageChart.destroy();
    ageChart = new Chart(document.getElementById("chart-age-progress"), {
        type: "line",
        data: {
            labels: ageLabels,
            datasets: [
                {
                    label: "Your Child",
                    data: actualPct,
                    borderColor: isLight ? "#666" : "#ccc",
                    backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(200,200,200,0.15)",
                    fill: true, tension: 0.3, pointRadius: 4, borderWidth: 2
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
            plugins: { legend: { position: "bottom", labels: { color: CD.color, font: CD.font, padding: 16 } } },
            scales: {
                y: { beginAtZero: true, max: 100, grid: { color: CD.grid }, ticks: { color: CD.color, font: CD.font, callback: v => v + "%" } },
                x: { grid: { display: false }, ticks: { color: CD.color, font: CD.font, maxRotation: 45, minRotation: 30 } }
            }
        }
    });
}

// ── Accordion ────────────────────────────────────────────────────────────────
function renderAccordion() {
    const container = document.getElementById("milestone-accordion");
    container.innerHTML = "";

    AGE_GROUPS.forEach(age => {
        const group = definitions.filter(d => d.age_months === age);
        if (group.length === 0) return;

        const achieved = group.filter(d => (userMilestones[d.id] || {}).status === "achieved").length;
        const pct = Math.round((achieved / group.length) * 100);
        const isCurrentGroup = childAgeMonths !== null && childAgeMonths >= age && (AGE_GROUPS.indexOf(age) === AGE_GROUPS.length - 1 || childAgeMonths < AGE_GROUPS[AGE_GROUPS.indexOf(age) + 1]);
        const isPast = childAgeMonths !== null && childAgeMonths > age && !isCurrentGroup;

        const section = document.createElement("div");
        section.className = "milestone-section";
        section.innerHTML = `
            <div class="milestone-section-header" onclick="this.parentElement.classList.toggle('open')">
                <div style="display:flex; align-items:center; gap:12px;">
                    <span class="milestone-age-badge ${isCurrentGroup ? 'current' : ''}">${AGE_LABELS[age]}</span>
                    ${isCurrentGroup ? '<span style="font-size:11px; color:#eaeaea; font-weight:600;">CURRENT</span>' : ''}
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
                ${group.map(d => renderMilestoneCard(d, isPast)).join("")}
            </div>
        `;

        // Auto-open current group
        if (isCurrentGroup) section.classList.add("open");

        container.appendChild(section);
    });
}

function renderMilestoneCard(def, isPastGroup) {
    const catColors = getCatColors();
    const data = userMilestones[def.id] || { status: "not_yet", notes: "" };
    const status = data.status || "not_yet";
    const isDelayed = status !== "achieved" && childAgeMonths !== null && def.age_months < childAgeMonths;
    const catColor = catColors[def.category] || "#a0a0a0";

    return `
        <div class="milestone-card ${isDelayed ? 'delayed' : ''}" id="mc-${def.id}">
            <div class="milestone-card-top">
                <div style="display:flex; align-items:center; gap:10px; flex:1;">
                    <span class="milestone-cat-dot" style="background:${catColor};"></span>
                    <span class="milestone-cat-label" style="color:${catColor};">${CAT_LABELS[def.category]}</span>
                    ${isDelayed ? '<span class="milestone-delay-badge">⚠ Delayed</span>' : ''}
                </div>
                <button class="milestone-status-btn" style="color:${STATUS_COLORS[status]}; border-color:${STATUS_COLORS[status]};"
                        onclick="cycleStatus('${def.id}')">
                    ${STATUS_LABELS[status]}
                </button>
            </div>
            <p class="milestone-text">${def.text}</p>
            <textarea class="milestone-notes" placeholder="Add notes or observations..."
                      onchange="updateNotes('${def.id}', this.value)">${data.notes || ""}</textarea>
        </div>
    `;
}

// ── Interactions ─────────────────────────────────────────────────────────────
function cycleStatus(id) {
    const current = (userMilestones[id] || {}).status || "not_yet";
    const nextIdx = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length;
    if (!userMilestones[id]) userMilestones[id] = { status: "not_yet", notes: "" };
    userMilestones[id].status = STATUS_CYCLE[nextIdx];
    renderAll();
}

function updateNotes(id, val) {
    if (!userMilestones[id]) userMilestones[id] = { status: "not_yet", notes: "" };
    userMilestones[id].notes = val;
}
