// ==========================================
// DOCTOR PROFILE — Edit + Ratings
// ==========================================

let doctorEmail = "";

// ── Auth Guard + Init ─────────────────────────────────────────────────────────
(function() {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user || user.role !== "doctor") {
        window.location.replace("login.html");
        return;
    }
    doctorEmail = user.email;
    const name = user.username || user.email.split("@")[0];
    const el = document.getElementById("greetingText");
    if (el) el.innerText = `Hi, ${name}`;
    const av = document.getElementById("avatarLetter");
    if (av) av.innerText = name.charAt(0).toUpperCase();
})();

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

// ── Star Rendering ──────────────────────────────────────────────────────────
function starsHtml(avg, outOf = 5) {
    let html = "";
    for (let i = 1; i <= outOf; i++) {
        if (avg >= i) html += `<span class="star-filled">★</span>`;
        else if (avg >= i - 0.5) html += `<span class="star-half">★</span>`;
        else html += `<span class="star-empty">★</span>`;
    }
    return html;
}

function fmtDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ── Load Profile ──────────────────────────────────────────────────────────────
async function loadProfile() {
    if (!doctorEmail) return;
    try {
        const { ok, data } = await apiGetDoctorProfile(doctorEmail);
        if (!ok) return;

        // Header
        const displayName = data.name || data.username || doctorEmail.split("@")[0];
        document.getElementById("profile-display-name").innerText = displayName;
        document.getElementById("profile-display-spec").innerText = data.specialization || "Specialization not set";
        document.getElementById("profile-avg-stars").innerHTML = starsHtml(data.rating_avg);
        document.getElementById("profile-rating-text").innerText =
            data.rating_count ? `${data.rating_avg} / 5 (${data.rating_count} review${data.rating_count !== 1 ? "s" : ""})` : "No reviews yet";

        const av = document.getElementById("profile-avatar-letter");
        if (av) av.innerText = displayName.charAt(0).toUpperCase();

        // Form fields
        document.getElementById("field-name").value = data.name || "";
        document.getElementById("field-spec").value = data.specialization || "";
        document.getElementById("field-clinic").value = data.clinic_name || "";
        document.getElementById("field-address").value = data.clinic_address || "";
        document.getElementById("field-bio").value = data.bio || "";

        // Ratings list
        renderRatings(data.ratings || []);

    } catch (e) {
        console.error("Profile load error:", e);
    }
}

function renderRatings(ratings) {
    const container = document.getElementById("ratings-container");
    if (!ratings.length) {
        container.innerHTML = '<p style="color:#a0a0a0; font-size:14px; text-align:center;">No reviews from parents yet.</p>';
        return;
    }
    container.innerHTML = ratings.map(r => `
        <div class="rating-review-card">
            <div class="rating-review-header">
                <div class="rating-review-avatar">${r.initials}</div>
                <div>
                    <div style="font-weight:600; font-size:14px;">${r.initials}</div>
                    <div style="color:#a0a0a0; font-size:12px;">${r.timestamp ? new Date(r.timestamp).toLocaleDateString("en-US", {year:"numeric",month:"short",day:"numeric"}) : ""}</div>
                </div>
                <div class="rating-stars-sm">${starsHtml(r.score)}</div>
            </div>
            ${r.comment ? `<p class="rating-review-comment">${r.comment}</p>` : ""}
        </div>
    `).join("");
}

// ── Save Profile ──────────────────────────────────────────────────────────────
async function saveProfile() {
    const msgEl = document.getElementById("profile-save-msg");
    msgEl.style.display = "none";

    const payload = {
        email: doctorEmail,
        name: document.getElementById("field-name").value.trim(),
        specialization: document.getElementById("field-spec").value.trim(),
        clinic_name: document.getElementById("field-clinic").value.trim(),
        clinic_address: document.getElementById("field-address").value.trim(),
        bio: document.getElementById("field-bio").value.trim()
    };

    try {
        const { ok, data } = await apiUpdateDoctorProfile(payload);
        if (ok) {
            msgEl.innerText = "✓ Profile saved successfully!";
            msgEl.style.color = "#6bff8d";
            msgEl.style.borderColor = "#6bff8d";
            msgEl.style.backgroundColor = "rgba(107,255,141,0.08)";
            msgEl.style.display = "block";
            await loadProfile();
            setTimeout(() => { msgEl.style.display = "none"; }, 3000);
        } else {
            msgEl.innerText = data.error || "Failed to save profile.";
            msgEl.style.color = "#ff6b6b";
            msgEl.style.borderColor = "#ff6b6b";
            msgEl.style.backgroundColor = "rgba(255,107,107,0.08)";
            msgEl.style.display = "block";
        }
    } catch (e) {
        msgEl.innerText = SERVER_DOWN_MSG;
        msgEl.style.display = "block";
    }
}

document.addEventListener("DOMContentLoaded", loadProfile);
