// ==========================================
// QUESTION BANK WITH CUSTOM OPTION LABELS
// ==========================================

// Option sets tailored to question type:
// Type A: Positive behaviors (Never = concerning)
// Type B: Unusual/repetitive behaviors (Very Often = concerning)
// Type C: Sensitivity/intensity questions

const OPTIONS_A = ["Never", "Rarely", "Sometimes", "Often", "Always"];
const OPTIONS_B = ["Not at all", "Rarely", "Sometimes", "Often", "Very Often"];
const OPTIONS_C = ["Not at all", "Mildly", "Moderately", "Significantly", "Extremely"];

const autismQuestions = [
    { text: "Does your child look at you when you call their name?", opts: OPTIONS_A },
    { text: "How often does your child make eye contact?", opts: OPTIONS_A },
    { text: "Does your child point to indicate what they want?", opts: OPTIONS_A },
    { text: "Does your child show interest in other children?", opts: OPTIONS_A },
    { text: "Does your child imitate your actions (e.g., waving bye-bye)?", opts: OPTIONS_A },
    { text: "Does your child respond to your smile with a smile?", opts: OPTIONS_A },
    { text: "Does your child bring objects to show you?", opts: OPTIONS_A },
    { text: "Does your child understand simple verbal instructions?", opts: OPTIONS_A },
    { text: "Does your child engage in pretend play (e.g., feeding a doll)?", opts: OPTIONS_A },
    { text: "Does your child look where you are pointing?", opts: OPTIONS_A },
    { text: "Does your child have unusual finger movements near their eyes?", opts: OPTIONS_B },
    { text: "Does your child spin objects or themselves frequently?", opts: OPTIONS_B },
    { text: "Does your child get upset by everyday noises (e.g., a vacuum)?", opts: OPTIONS_C },
    { text: "Does your child have an intense interest in specific objects?", opts: OPTIONS_C },
    { text: "Does your child flap their hands or rock back and forth?", opts: OPTIONS_B },
    { text: "Does your child seem overly sensitive to textures (e.g., clothing tags)?", opts: OPTIONS_C },
    { text: "Does your child arrange toys in strict lines?", opts: OPTIONS_B },
    { text: "Does your child struggle with changes to their routine?", opts: OPTIONS_C },
    { text: "Does your child repeat words or phrases out of context?", opts: OPTIONS_B },
    { text: "Does your child seem to not feel pain like others do?", opts: OPTIONS_B },
    { text: "Does your child focus intensely on parts of toys (e.g., wheels)?", opts: OPTIONS_B },
    { text: "Does your child avoid physical contact or cuddling?", opts: OPTIONS_B },
    { text: "Does your child have unusual eating habits or extreme picky eating?", opts: OPTIONS_C },
    { text: "Does your child use your hand as a tool to get what they want?", opts: OPTIONS_B },
    { text: "Does your child show extreme distress during transitions?", opts: OPTIONS_C },
    { text: "Does your child have difficulty understanding other people's feelings?", opts: OPTIONS_C },
    { text: "Does your child use gestures to communicate (e.g., nodding)?", opts: OPTIONS_A },
    { text: "Does your child play with toys in conventional ways?", opts: OPTIONS_A },
    { text: "Does your child seek comfort from you when hurt or upset?", opts: OPTIONS_A },
    { text: "Does your child share enjoyment with you (e.g., laughing together)?", opts: OPTIONS_A }
];

const questionsDiv = document.getElementById("questions");

autismQuestions.forEach((q, index) => {
    const div = document.createElement("div");
    
    const optionsHtml = q.opts.map((label, val) => 
        `<label><input type="radio" name="q${index}" value="${val}"> <span>${label}</span></label>`
    ).join("\n            ");

    div.innerHTML = `
        <p><strong>Question ${index + 1}:</strong> ${q.text}</p>
        <div class="options">
            ${optionsHtml}
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

    // Use autismQuestions.length instead of magic number
    for (let i = 0; i < autismQuestions.length; i++) {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        if (selected) {
            answers.push(parseInt(selected.value));
        } else {
            allAnswered = false;
            break;
        }
    }

    if (!allAnswered) {
        errorDiv.innerText = `Please answer all ${autismQuestions.length} questions to ensure clinical accuracy.`;
        errorDiv.style.display = "block";
        btn.innerText = originalText;
        btn.disabled = false;
        errorDiv.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    // Validate age
    const ageInput = document.getElementById("child-age");
    const ageYears = parseInt(ageInput.value);
    if (!ageInput.value || isNaN(ageYears) || ageYears < 1 || ageYears > 18) {
        errorDiv.innerText = "Please enter the child's age (1–18 years) before submitting.";
        errorDiv.style.display = "block";
        btn.innerText = originalText;
        btn.disabled = false;
        ageInput.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    try {
        let email = "";
        try {
            const user = JSON.parse(localStorage.getItem("currentUser"));
            if (user && user.email) email = user.email;
        } catch (e) {}

        const { ok, data } = await apiSubmitQuestionnaire(answers, email, ageYears * 12);

        if (!ok) throw new Error(data.error || "Submission failed.");

        localStorage.setItem("screeningResult", JSON.stringify(data));
        window.location.href = "results.html";

    } catch (error) {
        console.error("Submission error:", error);
        errorDiv.innerText = "Submission failed. Please check your connection and try again.";
        errorDiv.style.display = "block";
        btn.innerText = originalText;
        btn.disabled = false;
    }
}