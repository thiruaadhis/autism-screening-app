from flask import Blueprint, request, jsonify

questionnaire_bp = Blueprint("questionnaire", __name__)

# 🔥 REVERSE SCORING MATRIX
# Answering "Never" (0) means HIGH likelihood (4 points).
REVERSE_SCORED_QUESTIONS = {
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 18
}

# 🔥 CLINICAL RED FLAGS & CRITICAL THRESHOLDS
CRITICAL_QUESTIONS = {0, 1, 4, 20}
WEIGHT_MULTIPLIER = 1.5
CRITICAL_TRIGGER_LIMIT = 2 # If 2 or more critical flags are triggered, auto-escalate to High Risk

@questionnaire_bp.route("/submit-questionnaire", methods=["POST"])
def submit_questionnaire():
    data = request.json.get("answers", [])

    if not data or len(data) != 30:
        return jsonify({"error": "Invalid answers"}), 400

    total_score = 0
    max_possible_score = 0
    critical_flags_triggered = 0

    # 🔥 DSM-5 Sub-Domain Tracking
    # Questions 0-14: Social Communication (Criteria A)
    # Questions 15-29: Repetitive/Sensory Behaviors (Criteria B)
    social_score = 0
    social_max = 0
    behavioral_score = 0
    behavioral_max = 0

    for i, answer in enumerate(data):
        # 1. Reverse Scoring
        if i in REVERSE_SCORED_QUESTIONS:
            base_score = 4 - answer
        else:
            base_score = answer

        # 2. Critical Red Flag Tracking
        is_critical = i in CRITICAL_QUESTIONS
        if is_critical and base_score >= 3: # If they scored 3 (Often) or 4 (Always) on a high-risk symptom
            critical_flags_triggered += 1

        weight = WEIGHT_MULTIPLIER if is_critical else 1.0
        final_score = base_score * weight
        max_q_score = 4 * weight

        total_score += final_score
        max_possible_score += max_q_score

        # 3. Sub-domain Allocation
        if i < 15:
            social_score += final_score
            social_max += max_q_score
        else:
            behavioral_score += final_score
            behavioral_max += max_q_score

    # 4. Calculate Percentages
    likelihood = (total_score / max_possible_score) * 100
    social_percent = (social_score / social_max) * 100 if social_max > 0 else 0
    behavioral_percent = (behavioral_score / behavioral_max) * 100 if behavioral_max > 0 else 0

    # 5. Clinical Interpretations with Auto-Escalation
    if critical_flags_triggered >= CRITICAL_TRIGGER_LIMIT:
        interpretation = "High likelihood. Multiple critical developmental markers were flagged. A formal evaluation by a specialist is strongly recommended immediately."
        # Artificially bump the likelihood to a minimum of 75% so the UI matches the severity
        likelihood = max(likelihood, 75.0) 
    elif likelihood < 35:
        interpretation = "Low likelihood, but consider monitoring and consulting a specialist if concerns persist."
    elif likelihood < 70:
        interpretation = "Moderate likelihood. It is recommended to consult a developmental pediatrician or healthcare professional."
    else:
        interpretation = "High likelihood. A formal evaluation by a specialist is strongly recommended."

    return jsonify({
        "likelihood": round(likelihood, 2),
        "social_percent": round(social_percent, 2),
        "behavioral_percent": round(behavioral_percent, 2),
        "critical_flags": critical_flags_triggered,
        "interpretation": interpretation
    })