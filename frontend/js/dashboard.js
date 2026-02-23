// ==========================================
// GLOBAL SETTINGS INJECTION
// ==========================================
function applySettings() {
    const reduceMotion = localStorage.getItem('setting_reduceMotion') === 'true';
    const dyslexiaFont = localStorage.getItem('setting_dyslexiaFont') === 'true';
    const lightMode = localStorage.getItem('setting_lightMode') === 'true';

    if (reduceMotion) document.body.classList.add('reduce-motion');
    else document.body.classList.remove('reduce-motion');

    if (dyslexiaFont) document.body.classList.add('dyslexia-mode');
    else document.body.classList.remove('dyslexia-mode');

    if (lightMode) document.body.classList.add('light-mode');
    else document.body.classList.remove('light-mode');
}

applySettings();

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
            if (user.username && user.username !== "Xyz" && user.username.trim() !== "") {
                displayString = user.username;
            } 
            else if (user.email) {
                displayString = user.email.split('@')[0];
            }
        } catch (e) {
            console.error("Matrix parse error:", e);
        }
    } 

    if (document.getElementById('greetingText')) {
        document.getElementById('greetingText').innerText = `Hi, ${displayString}`;
        const avatarChar = displayString.charAt(0).toUpperCase();
        document.getElementById('avatarLetter').innerText = avatarChar;
    }
});