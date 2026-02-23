function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
    } else {
        input.type = "password";
    }
}

function goLogin() {
    window.location.replace('login.html');
}

function signup() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const verifyPassword = document.getElementById('verify-password').value;
    const errorDiv = document.getElementById('signup-error');

    if (!email || !password || !verifyPassword) {
        errorDiv.innerText = "All fields are required.";
        errorDiv.style.display = "block";
        return;
    }
    if (password !== verifyPassword) {
        errorDiv.innerText = "Passwords do not match.";
        errorDiv.style.display = "block";
        return;
    }
    
    // Save email to local storage for the dashboard name extraction!
    localStorage.setItem('currentUser', JSON.stringify({ email: email }));
    
    window.location.replace('dashboard.html');
}

function closeModal() {
    document.getElementById('authModal').classList.add('hidden');
}