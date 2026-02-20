async function login(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if(!email || !password){
        alert("Please enter email and password");
        return;
    }

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
        showError(data.error);
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

function showError(message){
    document.getElementById("modalText").innerText = message;
    document.getElementById("authModal").classList.remove("hidden");
}

function closeModal(){
    document.getElementById("authModal").classList.add("hidden");
}

function googleLogin(){
    localStorage.setItem("user", "google-user");
    window.location.href = "dashboard.html";
}

function goSignup(){
    window.location.href = "signup.html";
}