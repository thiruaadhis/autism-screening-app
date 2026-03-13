// Role tracking — default to parent
let selectedRole = "parent";

function selectRole(role) {
    selectedRole = role;
    document.getElementById("role-parent").classList.toggle("role-active", role === "parent");
    document.getElementById("role-doctor").classList.toggle("role-active", role === "doctor");
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId || 'password');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function goSignup() {
    window.location.replace('signup.html');
}

function closeModal() {
    document.getElementById('authModal').classList.add('hidden');
}

async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    errorDiv.style.display = 'none';

    if (!email || !password) {
        errorDiv.innerText = "Please fill in all fields.";
        errorDiv.style.display = 'block';
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorDiv.innerText = "Please enter a valid email format.";
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const { ok, data } = await apiLogin(email, password);

        if (!ok) {
            if (data.error === "Account not found") {
                document.getElementById('modalText').innerText = "Account not found. Would you like to create one?";
                document.getElementById('createAccountBtn').style.display = "inline-block";
                document.getElementById('authModal').classList.remove('hidden');
                return;
            }
            errorDiv.innerText = data.error || "Login failed.";
            errorDiv.style.display = 'block';
            return;
        }

        // Trust the server's stored role — no manual toggle check needed
        const accountRole = data.role || "parent";
        
        // --- DIAGNOSTIC ALERTS FOR USER ---
        alert(`Login Success! Server says your email is: ${data.email}\nServer says your role is: ${accountRole}`);
        // ----------------------------------

        console.log("Login Success! Server returned role:", accountRole);

        // Nuke any stale session data before writing the new one
        localStorage.removeItem('currentUser');
        localStorage.removeItem('screeningResult');

        localStorage.setItem('currentUser', JSON.stringify({
            email: data.email,
            username: data.username,
            role: accountRole
        }));

        console.log("Session saved. Redirecting...");

        // Redirect based on account role, not the UI toggle
        if (accountRole === "doctor") {
            window.location.href = 'doctor-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }

    } catch (error) {
        console.error("Login error:", error);
        errorDiv.innerText = SERVER_DOWN_MSG;
        errorDiv.style.display = 'block';
    }
}

// Pre-select role from URL param if provided
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");
    if (roleParam === "doctor") selectRole("doctor");
    else selectRole("parent");
});