function togglePassword() {
    const pwd = document.getElementById('password');
    if (pwd.type === 'password') {
        pwd.type = 'text';
    } else {
        pwd.type = 'password';
    }
}

function goSignup() {
    window.location.replace('signup.html');
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    if (!email || !password) {
        errorDiv.innerText = "Please enter both email and password.";
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