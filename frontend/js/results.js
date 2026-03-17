// ==========================================
// RESULTS PAGE — Full breakdown renderer
// ==========================================

const data = JSON.parse(localStorage.getItem("screeningResult"));

// Guard: if no result data, redirect back to the questionnaire
if (!data) {
    window.location.replace("questionnaire.html");
}

function getLikelihoodColor(likelihood) {
    if (likelihood >= 70) return "#dc143c";
    if (likelihood >= 35) return "#d4a017";
    return "#2e7d32";
}

function renderResults(result) {
    const color = getLikelihoodColor(result.likelihood);

    // Main score
    const scoreEl = document.getElementById("score");
    if (scoreEl) {
        scoreEl.innerHTML = `<span style="color: ${color};">${result.likelihood}%</span> Likelihood`;
    }

    // Interpretation
    const interpEl = document.getElementById("interpretation");
    if (interpEl) {
        interpEl.innerText = result.interpretation;
    }

    // Sub-domain stats
    const socialEl = document.getElementById("social-percent");
    if (socialEl) socialEl.innerText = `${result.social_percent}%`;

    const behavEl = document.getElementById("behavioral-percent");
    if (behavEl) behavEl.innerText = `${result.behavioral_percent}%`;

    const flagsEl = document.getElementById("critical-flags");
    if (flagsEl) flagsEl.innerText = result.critical_flags;

    // Progress bars
    const socialBar = document.getElementById("social-bar");
    if (socialBar) socialBar.style.width = `${result.social_percent}%`;

    const behavBar = document.getElementById("behavioral-bar");
    if (behavBar) behavBar.style.width = `${result.behavioral_percent}%`;
}

if (data) {
    renderResults(data);
}