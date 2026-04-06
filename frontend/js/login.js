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
        
        // Show in-page success feedback
        const successDiv = document.getElementById('login-success');
        const roleLabel = accountRole === "doctor" ? "Medical Professional" : "Parent";
        successDiv.innerText = `Login successful! Logged in as: ${roleLabel}`;
        successDiv.style.display = 'block';

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

        // Redirect after brief delay so user sees the success message
        setTimeout(() => {
            if (accountRole === "doctor") {
                window.location.href = 'doctor-dashboard.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 2000);

    } catch (error) {
        console.error("Login error:", error);
        errorDiv.innerText = SERVER_DOWN_MSG;
        errorDiv.style.display = 'block';
    }
}