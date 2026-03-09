import json
import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from services.scoring_service import calculate_score, TOTAL_QUESTIONS, MAX_ANSWER_VALUE

questionnaire_bp = Blueprint("questionnaire", __name__)

# --- Results Storage ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_FILE = os.path.join(BASE_DIR, "../data/results.json")

def load_results():
    if not os.path.exists(RESULTS_FILE):
        return []
    with open(RESULTS_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_results(data):
    os.makedirs(os.path.dirname(RESULTS_FILE), exist_ok=True)
    with open(RESULTS_FILE, "w") as f:
        json.dump(data, f, indent=4)


@questionnaire_bp.route("/submit-questionnaire", methods=["POST"])
def submit_questionnaire():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        answers = data.get("answers", [])
        email = data.get("email", "").strip()
        age_months = data.get("age_months", None)

        # --- Input Validation ---
        if not isinstance(answers, list) or len(answers) != TOTAL_QUESTIONS:
            return jsonify({"error": f"Expected exactly {TOTAL_QUESTIONS} answers."}), 400

        for i, answer in enumerate(answers):
            if not isinstance(answer, int) or answer < 0 or answer > MAX_ANSWER_VALUE:
                return jsonify({"error": f"Answer {i + 1} must be an integer between 0 and {MAX_ANSWER_VALUE}."}), 400

        # --- Score Calculation (delegated to service) ---
        result = calculate_score(answers, age_months=age_months)

        # --- Auto-save result if email is provided ---
        if email:
            record = {
                "id": str(uuid.uuid4()),
                "email": email,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "likelihood": result["likelihood"],
                "social_percent": result["social_percent"],
                "behavioral_percent": result["behavioral_percent"],
                "critical_flags": result["critical_flags"],
                "interpretation": result["interpretation"]
            }
            results = load_results()
            results.append(record)
            save_results(results)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500