from flask import Blueprint, request, jsonify

questionnaire_bp = Blueprint("questionnaire", __name__)

# 🔥 REVERSE SCORING MATRIX
# Answering "Never" (0) means HIGH likelihood (4 points).
REVERSE_SCORED_QUESTIONS = {
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 18
}

# 🔥 CLINICAL RED FLAGS
CRITICAL_QUESTIONS = {0, 1, 4, 20}
WEIGHT_MULTIPLIER = 1.5

@questionnaire_bp.route("/submit-questionnaire", methods=["POST"])
def submit_questionnaire():
    data = request.json.get("answers", [])

    if not data or len(data) != 30:
        return jsonify({"error": "Invalid answers"}), 400

    total_score = 0
    max_possible_score = 0
    critical_flags_triggered = 0

    # DSM-5 Sub-Domain Tracking
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
        if is_critical and base_score >= 3: # Scored 3 (Often) or 4 (Always) on a high-risk symptom
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

    # 4. Calculate Raw Percentages
    likelihood = (total_score / max_possible_score) * 100 if max_possible_score > 0 else 0
    social_percent = (social_score / social_max) * 100 if social_max > 0 else 0
    behavioral_percent = (behavioral_score / behavioral_max) * 100 if behavioral_max > 0 else 0

    # 5. 🔥 UPGRADED CLINICAL LOGIC (The False-Positive Fix)
    # We blend the raw percentage with the critical flags using an Escalation Matrix.
    
    if likelihood >= 70 or critical_flags_triggered >= 3:
        interpretation = "High likelihood. Significant developmental markers were flagged. A formal evaluation by a specialist is strongly recommended."
        # Gently ensure the UI reflects the severity if triggered by flags, but no massive 75% jumps
        likelihood = max(likelihood, 70.0) 
        
    elif likelihood >= 35 or critical_flags_triggered >= 1:
        interpretation = "Moderate likelihood. Some specific behaviors were flagged. It is recommended to consult a developmental pediatrician for a follow-up."
        # Escalate to the moderate floor if a single critical flag is caught
        likelihood = max(likelihood, 35.0)
        
    else:
        interpretation = "Low likelihood, but consider monitoring and consulting a healthcare professional if concerns persist."

    return jsonify({
        "likelihood": round(likelihood, 2),
        "social_percent": round(social_percent, 2),
        "behavioral_percent": round(behavioral_percent, 2),
        "critical_flags": critical_flags_triggered,
        "interpretation": interpretation
    })