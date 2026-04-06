// ==========================================
// DOCTOR APPOINTMENTS — Manage Requests
// ==========================================

// ── Sidebar ───────────────────────────────────────────────────────────────────
function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

let doctorEmail = "";
let allAppointments = [];
let activeFilter = "all";
let rejectTarget = null;   // appointment id being rejected


// ── Init ──────────────────────────────────────────────────────────────────────
(function() {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user || user.role !== "doctor") {
        window.location.replace("login.html");
        return;
    }
    doctorEmail = user.email;
})();

// ── Status badge ──────────────────────────────────────────────────────────────
function apptBadge(status) {
    const labels = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
    return `<span class="appt-badge ${status}">${labels[status] || status}</span>`;
}

// ── Filter ────────────────────────────────────────────────────────────────────
function setFilter(f) {
    activeFilter = f;
    document.querySelectorAll(".appt-filter-btn").forEach(btn => btn.classList.remove("active"));
    const el = document.getElementById(`filter-${f}`);
    if (el) el.classList.add("active");
    renderAppointments();
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderAppointments() {
    const tbody = document.getElementById("appt-tbody");
    const list = activeFilter === "all"
        ? allAppointments
        : allAppointments.filter(a => a.status === activeFilter);

    if (!list.length) {
        const msg = activeFilter === "all"
            ? "No appointment requests yet."
            : `No ${activeFilter} appointments.`;
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#a0a0a0; padding:32px;">${msg}</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(a => {
        const createdDate = a.created_at
            ? new Date(a.created_at).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })
            : "—";
        const reqDate = a.requested_date
            ? new Date(a.requested_date + "T00:00:00").toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })
            : "—";

        let actions = `<span style="color:#555; font-size:12px;">—</span>`;
        if (a.status === "pending") {
            actions = `
                <div style="display:flex; gap:7px; flex-wrap:wrap;">
                    <button class="btn-approve" onclick="approveAppointment('${a.id}')">Approve</button>
                    <button class="btn-reject"  onclick="openRejectModal('${a.id}', '${escHtml(a.parent_name || a.parent_email)}')">Reject</button>
                </div>`;
        }

        const rejNote = a.status === "rejected" && a.rejection_reason
            ? `<div style="font-size:11.5px; color:#dc143c; margin-top:4px; display:flex; gap:4px; align-items:flex-start;">
                   <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0; margin-top:2px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                   ${escHtml(a.rejection_reason)}</div>`
            : "";

        return `
            <tr>
                <td>
                    <strong>${escHtml(a.parent_name || a.parent_email)}</strong>
                    <div style="font-size:11px; color:#a0a0a0; margin-top:2px;">${escHtml(a.parent_email)}</div>
                </td>
                <td style="max-width:200px; color:#ccc;">${a.reason ? escHtml(a.reason) : "<span style='color:#555;font-style:italic;'>—</span>"}</td>
                <td>${reqDate}</td>
                <td style="color:#a0a0a0; font-size:12px;">${createdDate}</td>
                <td>${apptBadge(a.status)}${rejNote}</td>
                <td>${actions}</td>
            </tr>`;
    }).join("");
}

// ── Load from API ─────────────────────────────────────────────────────────────
async function loadAppointments() {
    const tbody = document.getElementById("appt-tbody");
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#a0a0a0; padding:28px;">Loading…</td></tr>`;

    try {
        const { ok, data } = await apiGetAppointments(doctorEmail, "doctor");
        if (!ok) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#dc143c; padding:28px;">Failed to load appointments. Is the server running?</td></tr>`;
            return;
        }
        allAppointments = data.appointments || [];
        updateStats();
        renderAppointments();
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#dc143c; padding:28px;">Unable to reach the server.</td></tr>`;
    }
}

function updateStats() {
    const pending  = allAppointments.filter(a => a.status === "pending").length;
    const approved = allAppointments.filter(a => a.status === "approved").length;
    const rejected = allAppointments.filter(a => a.status === "rejected").length;
    document.getElementById("stat-pending").textContent  = pending;
    document.getElementById("stat-approved").textContent = approved;
    document.getElementById("stat-rejected").textContent = rejected;
}

// ── Approve ───────────────────────────────────────────────────────────────────
async function approveAppointment(id) {
    try {
        const { ok, data } = await apiRespondAppointment(id, "approved", "", doctorEmail);
        if (ok) {
            showDoctorToast("Appointment approved!");
            await loadAppointments();
        } else {
            alert(data.error || "Failed to approve.");
        }
    } catch (e) {
        alert(SERVER_DOWN_MSG);
    }
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function openRejectModal(id, patientName) {
    rejectTarget = id;
    document.getElementById("reject-modal-subtitle").textContent =
        `You are rejecting ${patientName}'s appointment request. Please provide a reason so they understand.`;
    document.getElementById("reject-reason-input").value = "";
    document.getElementById("reject-error").style.display = "none";
    document.getElementById("reject-modal").classList.remove("hidden");
}

function closeRejectModal() {
    document.getElementById("reject-modal").classList.add("hidden");
    rejectTarget = null;
}

async function confirmReject() {
    const errEl = document.getElementById("reject-error");
    errEl.style.display = "none";

    const reason = document.getElementById("reject-reason-input").value.trim();
    if (!reason) {
        errEl.textContent = "Please provide a reason for the rejection.";
        errEl.style.display = "block";
        return;
    }

    const btn = document.getElementById("reject-confirm-btn");
    btn.disabled = true;
    btn.textContent = "Rejecting…";

    try {
        const { ok, data } = await apiRespondAppointment(rejectTarget, "rejected", reason, doctorEmail);
        if (ok) {
            closeRejectModal();
            showDoctorToast("Appointment rejected.");
            await loadAppointments();
        } else {
            errEl.textContent = data.error || "Failed to reject.";
            errEl.style.display = "block";
        }
    } catch (e) {
        errEl.textContent = SERVER_DOWN_MSG;
        errEl.style.display = "block";
    } finally {
        btn.disabled = false;
        btn.textContent = "Confirm Rejection";
    }
}

// ── Utility ───────────────────────────────────────────────────────────────────
function escHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function showDoctorToast(msg) {
    let toast = document.getElementById("doctor-appt-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "doctor-appt-toast";
        Object.assign(toast.style, {
            position: "fixed", bottom: "28px", left: "50%", transform: "translateX(-50%)",
            background: "#2e7d32", color: "white", padding: "10px 22px",
            borderRadius: "24px", fontSize: "13.5px", fontWeight: "600",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)", zIndex: "9999",
            opacity: "0", transition: "opacity 0.25s"
        });
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    setTimeout(() => { toast.style.opacity = "0"; }, 3000);
}

document.addEventListener("DOMContentLoaded", loadAppointments);
