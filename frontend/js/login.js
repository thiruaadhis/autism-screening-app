async function login(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorBox = document.getElementById("login-error");

    // Reset error message
    errorBox.style.display = "none";
    errorBox.innerText = "";

    // 1. Check for empty fields
    if(!email || !password){
        showInlineError("Please enter email and password");
        return;
    }

    // 2. 🔥 The Email Regex Bouncer
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showInlineError("Invalid email format!");
        return;
    }

    // If it survives, send it to the Flask server
    const res = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({email, password})
    });

    const data = await res.json();

    if(res.ok){
        localStorage.setItem("user", email);
        window.location.href = "dashboard.html";
    } else {
        if (data.error === "Wrong password") {
            showInlineError("Wrong password. Please try again.");
        } else {
            // Use modal for "Account not found" or other errors
            const showCreateBtn = data.error === "Account not found";
            showModalError(data.error, showCreateBtn);
        }
    }
}

function togglePassword(){
    const input = document.getElementById("password");
    const eye = document.getElementById("eye");

    if(input.type === "password"){
        input.type = "text";
        eye.style.opacity = 0.6;
    } else {
        input.type = "password";
        eye.style.opacity = 1;
    }
}

function showInlineError(message) {
    const errorBox = document.getElementById("login-error");
    errorBox.innerText = message;
    errorBox.style.display = "block";
}

function showModalError(message, showCreateBtn = false){
    document.getElementById("modalText").innerText = message;
    const createBtn = document.getElementById("createAccountBtn");
    if(createBtn) {
        createBtn.style.display = showCreateBtn ? "inline-block" : "none";
    }
    document.getElementById("authModal").classList.remove("hidden");
}

function closeModal(){
    document.getElementById("authModal").classList.add("hidden");
}

function goSignup(){
    window.location.href = "signup.html";
}