function togglePassword(inputId) {
    const input = document.getElementById(inputId || 'password');
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
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

    // 1. Basic empty check
    if (!email || !password) {
        errorDiv.innerText = "Please fill in all fields.";
        errorDiv.style.display = 'block';
        return;
    }

    // 2. Strict Regex Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorDiv.innerText = "Please enter a valid email format.";
        errorDiv.style.display = 'block';
        return;
    }

    try {
        // Send the data to the Python Backend!
        const response = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });

        const data = await response.json();

        if (!response.ok) {
            // If Python says the account doesn't exist, fire the modal
            if (data.error === "Account not found") {
                document.getElementById('modalText').innerText = "Account not found. Would you like to create one?";
                document.getElementById('createAccountBtn').style.display = "inline-block";
                document.getElementById('authModal').classList.remove('hidden');
                return;
            }
            
            // For wrong passwords or other errors, show the red box
            errorDiv.innerText = data.error || "Login failed.";
            errorDiv.style.display = 'block';
            return;
        }

        // Success! Save session and teleport
        localStorage.setItem('currentUser', JSON.stringify({ email: data.email, username: data.username }));
        window.location.replace('dashboard.html');

    } catch (error) {
        console.error("Backend fetch error:", error);
        errorDiv.innerText = "Cannot connect to Python Backend. Is app.py running?";
        errorDiv.style.display = 'block';
    }
}