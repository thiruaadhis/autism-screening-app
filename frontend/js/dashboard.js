const user = localStorage.getItem("user");

if(!user){
    window.location.href = "login.html";
}

document.getElementById("welcome").innerText = `Hello ${user}`;

function logout(){
    localStorage.removeItem("user");
    window.location.href = "login.html";
}