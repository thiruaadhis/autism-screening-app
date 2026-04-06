// ==========================================
// DOCTORS PAGE — Browse & Book (Parent View)
// ==========================================

let allDoctors = [];
let activeDoctor = null;  // currently viewed doctor object
let parentEmail = "";
let parentName = "";
let dpSelectedStars = 0;  // star rating inside profile modal


// ── Init ──────────────────────────────────────────────────────────────────────
(function() {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (user) {
        parentEmail = user.email;
        parentName = user.username || parentEmail.split("@")[0];
    }
})();

// ── Star display helper ───────────────────────────────────────────────────────
function starsDisplay(avg, outOf = 5) {
    let html = "";
    for (let i = 1; i <= outOf; i++) {
        if (avg >= i) html += `<span style="color:#d4a017;">★</span>`;
        else if (avg >= i - 0.5) html += `<span style="color:#d4a017; opacity:.55;">★</span>`;
        else html += `<span style="color:#555;">★</span>`;
    }
    return html;
}

// ── Status badge helper ───────────────────────────────────────────────────────
function apptBadge(status) {
    const labels = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
    return `<span class="appt-badge ${status}">${labels[status] || status}</span>`;
}

// ── Doctor Cards ──────────────────────────────────────────────────────────────
function renderDoctorCard(doc) {
    const displayName = doc.name || doc.username;
    const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const ratingText = doc.rating_count
        ? `${doc.rating_avg} · ${doc.rating_count} review${doc.rating_count !== 1 ? "s" : ""}`
        : "No reviews yet";

    return `
        <div class="doctor-card">
            <div class="doctor-card-avatar">${initials}</div>
            <div class="doctor-card-body">
                <div class="doctor-card-name">${displayName}</div>
                <div class="doctor-card-spec">${doc.specialization || "Specialist"}</div>
                ${doc.clinic_name ? `<div class="doctor-card-clinic">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px; margin-right:4px;"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>${doc.clinic_name}
                </div>` : ""}
                ${doc.clinic_address ? `<div class="doctor-card-location">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px; margin-right:4px;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>${doc.clinic_address}
                </div>` : ""}
                <div class="doctor-card-rating">
                    <span>${starsDisplay(doc.rating_avg)}</span>
                    <span class="doctor-rating-text">${ratingText}</span>
                </div>
            </div>
            <div class="doctor-card-actions">
                <button class="rate-btn" onclick='openDoctorProfile(${JSON.stringify(doc)})'>View Profile</button>
            </div>
        </div>
    `;
}

function renderDoctors(doctors) {
    const grid = document.getElementById("doctors-grid");
    if (!doctors.length) {
        grid.innerHTML = `<div style="color:#a0a0a0; text-align:center; width:100%; padding:40px 0;">
            No doctors are registered yet. Doctors will appear here once they create an account.
        </div>`;
        return;
    }
    grid.innerHTML = doctors.map(renderDoctorCard).join("");
}

function filterDoctors(query) {
    const q = query.toLowerCase();
    const filtered = allDoctors.filter(d =>
        (d.name || d.username).toLowerCase().includes(q) ||
        (d.specialization || "").toLowerCase().includes(q) ||
        (d.clinic_name || "").toLowerCase().includes(q)
    );
    renderDoctors(filtered);
}

// ── Doctor Profile Modal ──────────────────────────────────────────────────────
function openDoctorProfile(doc) {
    activeDoctor = doc;
    const displayName = doc.name || doc.username;
    const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    document.getElementById("dp-avatar").textContent = initials;
    document.getElementById("dp-name").textContent = displayName;
    document.getElementById("dp-spec").textContent = doc.specialization || "Specialist";

    // Details rows
    let details = "";
    if (doc.clinic_name) details += `
        <div class="doc-info-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>
            <span>${doc.clinic_name}</span>
        </div>`;
    if (doc.clinic_address) details += `
        <div class="doc-info-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span>${doc.clinic_address}</span>
        </div>`;
    document.getElementById("dp-details").innerHTML = details;

    // Bio
    const bioWrap = document.getElementById("dp-bio-wrap");
    if (doc.bio) {
        document.getElementById("dp-bio").textContent = doc.bio;
        bioWrap.style.display = "block";
    } else {
        bioWrap.style.display = "none";
    }

    // Rating
    const ratingText = doc.rating_count
        ? `${doc.rating_avg} / 5 · ${doc.rating_count} review${doc.rating_count !== 1 ? "s" : ""}`
        : "No reviews yet";
    document.getElementById("dp-stars").innerHTML = starsDisplay(doc.rating_avg);
    document.getElementById("dp-rating-text").textContent = ratingText;

    // Reset rating section
    dpSelectedStars = 0;
    updateDpStarDisplay(0);
    document.getElementById("dp-star-label").textContent = "Tap a star to rate";
    document.getElementById("dp-comment").value = "";
    document.getElementById("dp-rating-error").style.display = "none";

    document.getElementById("doctor-profile-modal").classList.remove("hidden");
}

function closeDoctorProfileModal() {
    document.getElementById("doctor-profile-modal").classList.add("hidden");
    activeDoctor = null;
}

// ── Rating inside profile modal ───────────────────────────────────────────────
const DP_STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

function selectDpStar(val) {
    dpSelectedStars = val;
    updateDpStarDisplay(val);
    document.getElementById("dp-star-label").textContent = DP_STAR_LABELS[val] || "";
}

function updateDpStarDisplay(val) {
    document.querySelectorAll(".dp-star").forEach(el => {
        el.classList.toggle("active", parseInt(el.dataset.val) <= val);
    });
}

async function submitDpRating() {
    const errEl = document.getElementById("dp-rating-error");
    errEl.style.display = "none";

    if (!parentEmail) {
        errEl.textContent = "Please log in to submit a review.";
        errEl.style.display = "block";
        return;
    }
    if (!dpSelectedStars) {
        errEl.textContent = "Please select a star rating before submitting."
        errEl.style.display = "block";
        return;
    }

    const comment = document.getElementById("dp-comment").value.trim();
    const btn = document.getElementById("dp-submit-rating-btn");
    btn.disabled = true;
    btn.textContent = "Submitting...";

    try {
        const { ok, data } = await apiRateDoctor(activeDoctor.email, parentEmail, dpSelectedStars, comment);
        if (ok) {
            closeDoctorProfileModal();
            showToast("Review submitted!");
            await loadDoctors();
        } else {
            errEl.textContent = data.error || "Failed to submit review.";
            errEl.style.display = "block";
        }
    } catch (e) {
        errEl.textContent = SERVER_DOWN_MSG;
        errEl.style.display = "block";
    } finally {
        btn.disabled = false;
        btn.textContent = "Submit Review";
    }
}

// ── Booking Modal ─────────────────────────────────────────────────────────────
function openBookingModal() {
    if (!activeDoctor) return;

    const displayName = activeDoctor.name || activeDoctor.username;
    document.getElementById("booking-modal-title").textContent = `Book with ${displayName}`;
    document.getElementById("booking-modal-subtitle").textContent =
        `${activeDoctor.specialization || "Specialist"}${activeDoctor.clinic_name ? " · " + activeDoctor.clinic_name : ""}`;

    // Default date = tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById("booking-date").value = tomorrow.toISOString().split("T")[0];
    document.getElementById("booking-date").min = new Date().toISOString().split("T")[0];

    document.getElementById("booking-reason").value = "";
    document.getElementById("booking-error").style.display = "none";

    document.getElementById("booking-modal").classList.remove("hidden");
    // Hide profile modal without nullifying activeDoctor (we still need it for submitBooking)
    document.getElementById("doctor-profile-modal").classList.add("hidden");
}

function closeBookingModal() {
    document.getElementById("booking-modal").classList.add("hidden");
    activeDoctor = null;
}

async function submitBooking() {
    const errEl = document.getElementById("booking-error");
    errEl.style.display = "none";

    if (!parentEmail) {
        errEl.textContent = "Please log in to book an appointment.";
        errEl.style.display = "block";
        return;
    }

    const requestedDate = document.getElementById("booking-date").value;
    if (!requestedDate) {
        errEl.textContent = "Please select a preferred date.";
        errEl.style.display = "block";
        return;
    }

    const reason = document.getElementById("booking-reason").value.trim();
    const btn = document.getElementById("booking-submit-btn");
    btn.disabled = true;
    btn.textContent = "Booking…";

    try {
        const { ok, data } = await apiBookAppointment(
            parentEmail, activeDoctor.email, reason, requestedDate
        );
        if (ok) {
            closeBookingModal();
            showToast("Appointment request sent!");
            await loadMyAppointments();
        } else {
            errEl.textContent = data.error || "Failed to book appointment.";
            errEl.style.display = "block";
        }
    } catch (e) {
        errEl.textContent = SERVER_DOWN_MSG;
        errEl.style.display = "block";
    } finally {
        btn.disabled = false;
        btn.textContent = "Confirm Booking";
    }
}

// ── My Appointments ───────────────────────────────────────────────────────────
async function loadMyAppointments() {
    if (!parentEmail) return;

    const tbody = document.getElementById("my-appointments-tbody");
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#a0a0a0; padding:20px;">Loading…</td></tr>`;

    try {
        const { ok, data } = await apiGetAppointments(parentEmail, "parent");
        if (!ok) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#dc143c; padding:20px;">Failed to load appointments.</td></tr>`;
            return;
        }
        const appts = data.appointments || [];
        if (!appts.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#a0a0a0; padding:24px;">No appointments yet. Browse doctors above and book one!</td></tr>`;
            return;
        }
        tbody.innerHTML = appts.map(a => {
            const createdDate = a.created_at ? new Date(a.created_at).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
            const reqDate = a.requested_date ? new Date(a.requested_date + "T00:00:00").toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
            const cancelBtn = a.status === "pending"
                ? `<button onclick="cancelAppointment('${a.id}')" style="padding:5px 12px; font-size:11.5px; background:#333; color:#dc143c; border:1px solid #dc143c; border-radius:6px; cursor:pointer;">Cancel</button>`
                : `<span style="color:#555; font-size:12px;">—</span>`;
            const rejRow = a.status === "rejected" && a.rejection_reason
                ? `<div class="appt-rejection-reason"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0; margin-top:1px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>${a.rejection_reason}</div>`
                : "";
            return `
                <tr>
                    <td><strong>${a.doctor_name || a.doctor_email}</strong></td>
                    <td style="max-width:180px; color:#ccc;">${a.reason || "<span style='color:#555;font-style:italic;'>—</span>"}</td>
                    <td>${reqDate}</td>
                    <td style="color:#a0a0a0; font-size:12px;">${createdDate}</td>
                    <td>${apptBadge(a.status)}${rejRow}</td>
                    <td>${cancelBtn}</td>
                </tr>`;
        }).join("");
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#dc143c; padding:20px;">Unable to reach the server.</td></tr>`;
    }
}

async function cancelAppointment(id) {
    if (!confirm("Cancel this appointment request?")) return;
    try {
        const { ok } = await apiCancelAppointment(id);
        if (ok) {
            showToast("Appointment cancelled.");
            await loadMyAppointments();
        } else {
            alert("Failed to cancel. Try again.");
        }
    } catch (e) {
        alert(SERVER_DOWN_MSG);
    }
}

// ── Toast helper ──────────────────────────────────────────────────────────────
function showToast(msg) {
    let toast = document.getElementById("doctors-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "doctors-toast";
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

// ── Main Load ─────────────────────────────────────────────────────────────────
async function loadDoctors() {
    try {
        const { ok, data } = await apiGetDoctors();
        if (!ok) {
            document.getElementById("doctors-grid").innerHTML =
                '<p style="color:#dc143c; text-align:center; width:100%;">Failed to load doctors. Is the server running?</p>';
            return;
        }
        allDoctors = data.doctors || [];
        renderDoctors(allDoctors);
    } catch (e) {
        console.error("Doctors load error:", e);
        document.getElementById("doctors-grid").innerHTML =
            '<p style="color:#dc143c; text-align:center; width:100%;">Unable to reach the server.</p>';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadDoctors();
    loadMyAppointments();
});
