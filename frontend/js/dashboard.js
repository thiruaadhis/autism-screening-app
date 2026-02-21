document.addEventListener("DOMContentLoaded", () => {
    const userEmail = localStorage.getItem("user");

    // Kick them out if they aren't logged in
    if(!userEmail){
        window.location.href = "login.html";
        return;
    }

    // 🔥 String Manipulation Magic: Extract Name from Email
    // If email is "thiruaadhi@gmail.com", split("@")[0] gets "thiruaadhi"
    const rawName = userEmail.split("@")[0];
    
    // Capitalize the first letter so it looks professional
    const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    // Update the DOM
    document.getElementById("greetingText").innerText = `Hi, ${displayName}`;
    
    // Set the Avatar bubble to the first letter of their name
    document.getElementById("avatarLetter").innerText = displayName.charAt(0).toUpperCase();
});

// 🔥 Sidebar Toggle Logic
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");
}

function logout(){
    localStorage.removeItem("user");
    window.location.href = "login.html";
}