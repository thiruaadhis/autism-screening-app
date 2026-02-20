document.addEventListener("DOMContentLoaded", () => {

const questions = [

"How often does your child comfortably make eye contact when interacting with you or others?",
"When you call your child's name, how consistently do they respond or acknowledge you?",
"How interested does your child seem in playing or interacting with other children of a similar age?",
"When you smile at your child, how often do they respond with a smile or positive facial expression?",
"How frequently does your child try to share objects, toys, or experiences with you to gain your attention?",
"When you point to something interesting, how often does your child follow your gesture or look in the same direction?",
"How often does your child attempt to draw your attention to things they find interesting or exciting?",
"In unfamiliar situations, how often does your child look at your face for reassurance or emotional cues?",

"How often does your child use gestures such as pointing, waving, or nodding to communicate needs or interests?",
"How frequently does your child imitate actions, sounds, or facial expressions shown by others?",
"How well does your child understand and respond to simple instructions without needing repeated prompts or gestures?",
"How comfortably does your child attempt to express their needs using words, sounds, or gestures?",
"How often does your child engage in back-and-forth vocalization or conversational attempts with you?",
"How frequently does your child engage in pretend communication, such as talking on a toy phone or role-playing?",
"How often does your child struggle to clearly communicate their emotions, needs, or discomfort?",

"How frequently does your child engage in imaginative or pretend play activities?",
"Does your child tend to prefer playing alone rather than engaging in interactive or shared play with others?",
"How often does your child use toys in repetitive or unusual ways instead of typical play patterns?",
"How much enjoyment does your child show when participating in interactive games like peek-a-boo or turn-taking activities?",
"How often does your child show limited interest in exploring a variety of play activities?",

"How frequently does your child repeat certain body movements such as rocking, spinning, or hand-flapping?",
"When daily routines change unexpectedly, how often does your child become noticeably upset or distressed?",
"How strongly does your child insist on performing activities in a specific order or familiar way?",
"How intensely does your child focus on specific objects, activities, or topics for extended periods?",
"How often does your child repeat particular sounds, words, or phrases multiple times?",

"How sensitive is your child to sounds, lights, textures, or other sensory experiences in their environment?",
"How often does your child avoid certain physical sensations such as touch, clothing textures, or grooming activities?",
"How frequently does your child seek sensory stimulation such as spinning objects, staring at lights, or repetitive movement?",
"How often does your child show emotional reactions that seem delayed, unusually intense, or difficult to interpret?",
"Compared to interacting with people, how often does your child appear more interested in objects or specific activities?"

];

const container = document.getElementById("questions");

questions.forEach((q, i) => {
    const div = document.createElement("div");

    div.innerHTML = `
        <p>${i+1}. ${q}</p>

        <div class="options">
            <label><input type="radio" name="q${i}" value="0" checked><span>Never</span></label>
            <label><input type="radio" name="q${i}" value="1"><span>Rarely</span></label>
            <label><input type="radio" name="q${i}" value="2"><span>Sometimes</span></label>
            <label><input type="radio" name="q${i}" value="3"><span>Often</span></label>
            <label><input type="radio" name="q${i}" value="4"><span>Always</span></label>
        </div>
    `;

    container.appendChild(div);
});

window.submitAnswers = async function () {

    const answers = [];

    for(let i=0;i<30;i++){
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        answers.push(parseInt(selected.value));
    }

    const result = await submitQuestionnaire(answers);

    localStorage.setItem("result", JSON.stringify(result));
    window.location.href = "results.html";
}

});