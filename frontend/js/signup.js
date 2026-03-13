let selectedRole = "parent";

function selectRole(role) {
    selectedRole = role;
    document.getElementById("role-parent").classList.toggle("role-active", role === "parent");
    document.getElementById("role-doctor").classList.toggle("role-active", role === "doctor");
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === "password" ? "text" : "password";
}

function goLogin() {
    window.location.replace('login.html');
}

function closeModal() {
    document.getElementById('authModal').classList.add('hidden');
    if (localStorage.getItem('currentUser')) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        window.location.replace(user.role === "doctor" ? 'doctor-dashboard.html' : 'dashboard.html');
    }
}

async function signup() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const verifyPassword = document.getElementById('verify-password').value;
    const errorDiv = document.getElementById('signup-error');
    errorDiv.style.display = 'none';

    if (!email || !password || !verifyPassword) {
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

    if (password.length < 6) {
        errorDiv.innerText = "Password must be at least 6 characters.";
        errorDiv.style.display = 'block';
        return;
    }

    if (password !== verifyPassword) {
        errorDiv.innerText = "Passwords do not match.";
        errorDiv.style.display = 'block';
        return;
    }

    const generatedUsername = email.split('@')[0];

    try {
        const { ok, data } = await apiSignup(email, password, generatedUsername, selectedRole);

        if (!ok) {
            errorDiv.innerText = data.error || "Registration failed.";
            errorDiv.style.display = 'block';
            return;
        }

        localStorage.setItem('currentUser', JSON.stringify({
            email: email,
            username: generatedUsername,
            role: selectedRole
        }));

        document.getElementById('modalText').innerText = `Account created successfully! Welcome, ${generatedUsername}.`;
        document.getElementById('authModal').classList.remove('hidden');

        setTimeout(() => {
            window.location.replace(selectedRole === "doctor" ? 'doctor-dashboard.html' : 'dashboard.html');
        }, 2000);

    } catch (error) {
        console.error("Signup error:", error);
        errorDiv.innerText = SERVER_DOWN_MSG;
        errorDiv.style.display = 'block';
    }
}

document.addEventListener("DOMContentLoaded", () => selectRole("parent"));