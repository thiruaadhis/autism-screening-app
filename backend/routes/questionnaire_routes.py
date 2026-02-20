from flask import Blueprint, request, jsonify

questionnaire_bp = Blueprint("questionnaire", __name__)

@questionnaire_bp.route("/submit-questionnaire", methods=["POST"])
def submit_questionnaire():
    data = request.json.get("answers", [])

    if not data or len(data) != 30:
        return jsonify({"error": "Invalid answers"}), 400

    max_score = 30 * 4
    total_score = sum(data)

    likelihood = (total_score / max_score) * 100

    if likelihood < 30:
        interpretation = "Low likelihood"
    elif likelihood < 60:
        interpretation = "Moderate likelihood"
    else:
        interpretation = "High likelihood"

    return jsonify({
        "likelihood": round(likelihood, 2),
        "interpretation": interpretation
    })