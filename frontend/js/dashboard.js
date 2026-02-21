document.addEventListener("DOMContentLoaded", () => {
    const userEmail = localStorage.getItem("user");

    // Kick them out if they aren't logged in
    if(!userEmail){
        window.location.href = "login.html";
        return;
    }

    // Extract Name from Email
    const rawName = userEmail.split("@")[0];
    const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    // Update the DOM for the header (Safe check in case it's missing)
    const greetingEl = document.getElementById("greetingText");
    const avatarEl = document.getElementById("avatarLetter");
    
    if (greetingEl && avatarEl) {
        greetingEl.innerText = `Hi, ${displayName}`;
        avatarEl.innerText = displayName.charAt(0).toUpperCase();
    }
});

// 🔥 Sidebar Toggle Logic
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if(sidebar) {
        sidebar.classList.toggle("collapsed");
    }
}

function logout(){
    localStorage.removeItem("user");
    window.location.href = "login.html";
}