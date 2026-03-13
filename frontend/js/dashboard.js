// ==========================================
// ROLE GUARD — Parent-only pages
// Doctors who land here get redirected.
// ==========================================
(function() {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return; 
    try {
        const user = JSON.parse(raw);
        if (user.role === 'doctor') {
            const path = window.location.pathname.toLowerCase();
            if (!path.includes('settings.html')) {
                window.location.replace('doctor-dashboard.html');
            }
        }
    } catch (e) {}
})();

// ==========================================
// UI LOGIC
// ==========================================
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.replace('login.html');
}

// ==========================================
// DYNAMIC PROFILE EXTRACTION ENGINE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const userPayload = localStorage.getItem('currentUser');
    let displayString = "User";

    if (userPayload) {
        try {
            const user = JSON.parse(userPayload);
            if (user.username && user.username.trim() !== "") {
                displayString = user.username;
            } else if (user.email) {
                displayString = user.email.split('@')[0];
            }
        } catch (e) {
            console.error("Failed to parse user session:", e);
        }
    }

    if (document.getElementById('greetingText')) {
        document.getElementById('greetingText').innerText = `Hi, ${displayString}`;
        const avatarChar = displayString.charAt(0).toUpperCase();
        document.getElementById('avatarLetter').innerText = avatarChar;
    }
});