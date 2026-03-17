// ==========================================
// DOCTORS PAGE — Browse & Rate (Parent View)
// ==========================================

let allDoctors = [];
let ratingTarget = null;  // { email, name }
let selectedStars = 0;
let parentEmail = "";

// ── Init ──────────────────────────────────────────────────────────────────────
(function() {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (user) parentEmail = user.email;
})();

// ── Star helpers ──────────────────────────────────────────────────────────────
function starsDisplay(avg, outOf = 5) {
    let html = "";
    for (let i = 1; i <= outOf; i++) {
        if (avg >= i) html += `<span class="star-filled">★</span>`;
        else if (avg >= i - 0.5) html += `<span class="star-half">★</span>`;
        else html += `<span class="star-empty">★</span>`;
    }
    return html;
}

// ── Doctor Cards ──────────────────────────────────────────────────────────────
function renderDoctorCard(doc) {
    const displayName = doc.name || doc.username;
    const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const ratingText = doc.rating_count
        ? `${doc.rating_avg} (${doc.rating_count} review${doc.rating_count !== 1 ? "s" : ""})`
        : "No reviews yet";

    return `
        <div class="doctor-card">
            <div class="doctor-card-avatar">${initials}</div>
            <div class="doctor-card-body">
                <div class="doctor-card-name">${displayName}</div>
                <div class="doctor-card-spec">${doc.specialization || "Specialist"}</div>
                ${doc.clinic_name ? `<div class="doctor-card-clinic">🏥 ${doc.clinic_name}</div>` : ""}
                ${doc.clinic_address ? `<div class="doctor-card-location">📍 ${doc.clinic_address}</div>` : ""}
                ${doc.bio ? `<p class="doctor-card-bio">${doc.bio}</p>` : ""}
                <div class="doctor-card-rating">
                    <span class="doctor-star-row">${starsDisplay(doc.rating_avg)}</span>
                    <span class="doctor-rating-text">${ratingText}</span>
                </div>
            </div>
            <div class="doctor-card-actions">
                <button class="rate-btn" onclick='openRatingModal(${JSON.stringify({ email: doc.email, name: displayName })})'>Rate</button>
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

// ── Rating Modal ──────────────────────────────────────────────────────────────
function openRatingModal(doc) {
    ratingTarget = doc;
    selectedStars = 0;
    document.getElementById("rating-modal-title").innerText = `Rate ${doc.name}`;
    document.getElementById("rating-modal-subtitle").innerText = "Your feedback helps other parents find the right specialist.";
    document.getElementById("rating-comment").value = "";
    document.getElementById("rating-error").style.display = "none";
    document.getElementById("star-label").innerText = "Tap a star to rate";
    updateStarInputDisplay(0);
    document.getElementById("rating-modal").classList.remove("hidden");
}

function closeRatingModal() {
    document.getElementById("rating-modal").classList.add("hidden");
    ratingTarget = null;
}

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

function selectStar(val) {
    selectedStars = val;
    updateStarInputDisplay(val);
    document.getElementById("star-label").innerText = STAR_LABELS[val] || "";
}

function updateStarInputDisplay(val) {
    document.querySelectorAll(".star-input-item").forEach(el => {
        const elVal = parseInt(el.dataset.val);
        el.classList.toggle("star-input-active", elVal <= val);
    });
}

async function submitRating() {
    const errEl = document.getElementById("rating-error");
    errEl.style.display = "none";

    if (!parentEmail) {
        errEl.innerText = "Please log in to submit a rating.";
        errEl.style.display = "block";
        return;
    }
    if (!selectedStars) {
        errEl.innerText = "Please select a star rating before submitting.";
        errEl.style.display = "block";
        return;
    }

    const comment = document.getElementById("rating-comment").value.trim();
    try {
        const { ok, data } = await apiRateDoctor(ratingTarget.email, parentEmail, selectedStars, comment);
        if (ok) {
            closeRatingModal();
            await loadDoctors();  // refresh ratings
        } else {
            errEl.innerText = data.error || "Failed to submit rating.";
            errEl.style.display = "block";
        }
    } catch (e) {
        errEl.innerText = SERVER_DOWN_MSG;
        errEl.style.display = "block";
    }
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

document.addEventListener("DOMContentLoaded", loadDoctors);
