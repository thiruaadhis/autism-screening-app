const data = JSON.parse(localStorage.getItem("screeningResult"));

if (data) {
    document.getElementById("score").innerText = `Likelihood: ${data.likelihood}%`;
    document.getElementById("interpretation").innerText = data.interpretation;
} else {
    document.getElementById("score").innerText = "No result found";
}