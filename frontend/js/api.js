async function submitQuestionnaire(answers){
    const response = await fetch("http://127.0.0.1:5000/submit-questionnaire", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({answers})
    });

    return await response.json();
}