const data = JSON.parse(localStorage.getItem("result"));

if (data) {
    document.getElementById("score").innerText = `Likelihood: ${data.likelihood}%`;
    document.getElementById("interpretation").innerText = data.interpretation;
} else {
    document.getElementById("score").innerText = "No result found";
}