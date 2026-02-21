async function signup(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const verifyPassword = document.getElementById("verify-password").value;
    const errorBox = document.getElementById("signup-error");

    // Reset error message
    errorBox.style.display = "none";
    errorBox.innerText = "";

    // 1. Check for empty fields
    if(!email || !password || !verifyPassword){
        showInlineError("Please fill all fields");
        return;
    }

    // 2. 🔥 The Email Regex Bouncer
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showInlineError("Invalid email format!");
        return;
    }

    // 3. Check for matching passwords
    if(password !== verifyPassword){
        showInlineError("Passwords do not match!");
        return;
    }

    // If it survives the bouncers, send it to the Flask server
    const res = await fetch("http://127.0.0.1:5000/signup", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({email, password})
    });

    const data = await res.json();

    if(res.ok){
        localStorage.setItem("user", email);
        window.location.href = "dashboard.html";
    } else {
        // Use modal for server-side errors like "Account already exists"
        showError(data.error || "Something went wrong!");
    }
}

function goLogin(){
    window.location.href = "login.html";
}

// 🔥 Generic Toggle function for any password field
function togglePassword(inputId, eyeId){
    const input = document.getElementById(inputId);
    const eye = document.getElementById(eyeId);

    if(input.type === "password"){
        input.type = "text";
        eye.style.opacity = 0.6;
    } else {
        input.type = "password";
        eye.style.opacity = 1;
    }
}

function showInlineError(message) {
    const errorBox = document.getElementById("signup-error");
    errorBox.innerText = message;
    errorBox.style.display = "block";
}

// Keep modal functions for server errors
function showError(message){
    document.getElementById("modalText").innerText = message;
    document.getElementById("authModal").classList.remove("hidden");
}

function closeModal(){
    document.getElementById("authModal").classList.add("hidden");
}