const autismQuestions = [
    "1. Does your child look at you when you call their name?",
    "2. How often does your child make eye contact?",
    "3. Does your child point to indicate what they want?",
    "4. Does your child show interest in other children?",
    "5. Does your child imitate your actions (e.g., waving bye-bye)?",
    "6. Does your child respond to your smile with a smile?",
    "7. Does your child bring objects to show you?",
    "8. Does your child understand simple verbal instructions?",
    "9. Does your child engage in pretend play (e.g., feeding a doll)?",
    "10. Does your child look where you are pointing?",
    "11. Does your child have unusual finger movements near their eyes?",
    "12. Does your child spin objects or themselves frequently?",
    "13. Does your child get upset by everyday noises (e.g., a vacuum)?",
    "14. Does your child have an intense interest in specific objects?",
    "15. Does your child flap their hands or rock back and forth?",
    "16. Does your child seem overly sensitive to textures (e.g., clothing tags)?",
    "17. Does your child arrange toys in strict lines?",
    "18. Does your child struggle with changes to their routine?",
    "19. Does your child repeat words or phrases out of context?",
    "20. Does your child seem to not feel pain like others do?",
    "21. Does your child focus intensely on parts of toys (e.g., wheels)?",
    "22. Does your child avoid physical contact or cuddling?",
    "23. Does your child have unusual eating habits or extreme picky eating?",
    "24. Does your child use your hand as a tool to get what they want?",
    "25. Does your child show extreme distress during transitions?",
    "26. Does your child have difficulty understanding other people's feelings?",
    "27. Does your child use gestures to communicate (e.g., nodding)?",
    "28. Does your child play with toys in conventional ways?",
    "29. Does your child seek comfort from you when hurt or upset?",
    "30. Does your child share enjoyment with you (e.g., laughing together)?"
];

const questionsDiv = document.getElementById("questions");

autismQuestions.forEach((q, index) => {
    const div = document.createElement("div");
    
    const questionText = q.substring(q.indexOf('.') + 1).trim();
    
    div.innerHTML = `
        <p><strong>Question ${index + 1}:</strong> ${questionText}</p>
        <div class="options">
            <label><input type="radio" name="q${index}" value="0"> <span>Never</span></label>
            <label><input type="radio" name="q${index}" value="1"> <span>Rarely</span></label>
            <label><input type="radio" name="q${index}" value="2"> <span>Sometimes</span></label>
            <label><input type="radio" name="q${index}" value="3"> <span>Often</span></label>
            <label><input type="radio" name="q${index}" value="4"> <span>Always</span></label>
        </div>
    `;
    questionsDiv.appendChild(div);
});

async function submitAnswers() {
    const btn = document.getElementById("submit-btn");
    const errorDiv = document.getElementById("form-error");
    const originalText = btn.innerText;
    
    errorDiv.style.display = "none";
    btn.innerText = "Submitting...";
    btn.disabled = true;

    const answers = [];
    let allAnswered = true;

    for (let i = 0; i < 30; i++) {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        if (selected) {
            answers.push(parseInt(selected.value));
        } else {
            allAnswered = false;
            break;
        }
    }

    if (!allAnswered) {
        errorDiv.innerText = "Please answer all 30 questions to ensure clinical accuracy.";
        errorDiv.style.display = "block";
        btn.innerText = originalText;
        btn.disabled = false;
        
        errorDiv.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/submit-questionnaire", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers })
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        
        localStorage.setItem("screeningResult", JSON.stringify(data));
        
        window.location.href = "results.html";

    } catch (error) {
        console.error("Error:", error);
        errorDiv.innerText = "Failed to submit to the ML Pipeline. Is the Python server running?";
        errorDiv.style.display = "block";
        btn.innerText = originalText;
        btn.disabled = false;
    }
}