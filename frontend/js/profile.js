// ==========================================
// PROFILE — Screening History Engine
// ==========================================

function getUserEmail() {
    try {
        const user = JSON.parse(localStorage.getItem("currentUser"));
        return user ? user.email : null;
    } catch (e) {
        return null;
    }
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const options = { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

function getLikelihoodColor(likelihood) {
    if (likelihood >= 70) return "#dc143c";
    if (likelihood >= 35) return "#d4a017";
    return "#2e7d32";
}

function renderHistoryCard(result) {
    const color = getLikelihoodColor(result.likelihood);
    
    return `
        <div class="history-card" id="result-${result.id}">
            <div class="history-header">
                <div>
                    <span class="history-likelihood" style="color: ${color};">${result.likelihood}%</span>
                    <span class="history-label">Likelihood</span>
                </div>
                <div class="history-date">${formatDate(result.timestamp)}</div>
            </div>
            
            <div class="history-stats">
                <div class="history-stat">
                    <span class="history-stat-value">${result.social_percent}%</span>
                    <span class="history-stat-label">Social</span>
                </div>
                <div class="history-stat">
                    <span class="history-stat-value">${result.behavioral_percent}%</span>
                    <span class="history-stat-label">Behavioral</span>
                </div>
                <div class="history-stat">
                    <span class="history-stat-value">${result.critical_flags}</span>
                    <span class="history-stat-label">Flags</span>
                </div>
            </div>

            <p class="history-interpretation">${result.interpretation}</p>

            <button class="history-delete-btn" onclick="deleteResult('${result.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                Delete
            </button>
        </div>
    `;
}

async function loadHistory() {
    const container = document.getElementById("history-container");
    const email = getUserEmail();

    // Populate user details
    try {
        const user = JSON.parse(localStorage.getItem("currentUser"));
        if (user) {
            document.getElementById("profile-username").innerText = user.username || user.email.split('@')[0];
            document.getElementById("profile-email").innerText = user.email || "—";
        }
    } catch (e) {}

    if (!email) {
        container.innerHTML = '<p style="text-align: center; color: #a0a0a0; font-size: 14px;">Please log in to view your screening history.</p>';
        return;
    }

    try {
        const { ok, data } = await apiGetResults(email);

        if (!ok) {
            container.innerHTML = '<p style="text-align: center; color: #dc143c; font-size: 14px;">Failed to load history.</p>';
            return;
        }

        // Update test count
        const countEl = document.getElementById("profile-test-count");
        if (countEl) countEl.innerText = data.results ? data.results.length : 0;

        if (!data.results || data.results.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #a0a0a0; font-size: 14px;">No screening results yet. Take your first test to see results here.</p>';
            return;
        }

        container.innerHTML = data.results.map(renderHistoryCard).join("");

    } catch (error) {
        console.error("History fetch error:", error);
        container.innerHTML = '<p style="text-align: center; color: #dc143c; font-size: 14px;">Unable to reach the server. Please check your connection.</p>';
    }
}

async function deleteResult(resultId) {
    try {
        const { ok } = await apiDeleteResult(resultId);

        if (ok) {
            const card = document.getElementById(`result-${resultId}`);
            if (card) {
                card.style.transition = "all 0.3s ease";
                card.style.opacity = "0";
                card.style.transform = "translateX(20px)";
                setTimeout(() => {
                    card.remove();
                    const container = document.getElementById("history-container");
                    if (!container.querySelector(".history-card")) {
                        container.innerHTML = '<p style="text-align: center; color: #a0a0a0; font-size: 14px;">No screening results yet. Take your first test to see results here.</p>';
                    }
                }, 300);
            }
        } else {
            console.error("Delete failed — result not found or server error.");
        }
    } catch (error) {
        console.error("Delete error:", error);
    }
}

// Load history on page load
document.addEventListener("DOMContentLoaded", loadHistory);
