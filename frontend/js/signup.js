async function signup(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if(!email || !password){
        alert("Please fill all fields");
        return;
    }

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
        alert(data.error);
    }
}

function goLogin(){
    window.location.href = "login.html";
}