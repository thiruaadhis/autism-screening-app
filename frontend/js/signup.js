function togglePassword(inputId) {
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

function closeModal() {
    document.getElementById('authModal').classList.add('hidden');
    if (localStorage.getItem('currentUser')) {
        window.location.replace('dashboard.html');
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
        // Send the data to the Python Backend to be saved in accounts.json!
        const response = await fetch('http://127.0.0.1:5000/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password, username: generatedUsername })
        });

        const data = await response.json();

        if (!response.ok) {
            // Python checks for duplicates and returns this error
            errorDiv.innerText = data.error || "Registration failed.";
            errorDiv.style.display = 'block';
            return;
        }

        // Success! Set session
        localStorage.setItem('currentUser', JSON.stringify({ email: email, username: generatedUsername }));

        // Fire Success Modal
        document.getElementById('modalText').innerText = "Account created successfully!";
        document.getElementById('authModal').classList.remove('hidden');

        setTimeout(() => {
            window.location.replace('dashboard.html');
        }, 2000);

    } catch (error) {
        console.error("Backend fetch error:", error);
        errorDiv.innerText = "Cannot connect to Python Backend. Is app.py running?";
        errorDiv.style.display = 'block';
    }
}