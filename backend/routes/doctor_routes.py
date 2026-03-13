import os
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from utils import load_json, save_json

doctor_bp = Blueprint("doctors", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCTORS_FILE = os.path.join(BASE_DIR, "../data/doctors.json")
ACCOUNTS_FILE = os.path.join(BASE_DIR, "../data/accounts.json")
RESULTS_FILE = os.path.join(BASE_DIR, "../data/results.json")


def get_or_create_doctor_profile(email):
    doctors = load_json(DOCTORS_FILE)
    profile = next((d for d in doctors if d["email"] == email), None)
    if not profile:
        profile = {
            "email": email,
            "name": "",
            "specialization": "",
            "clinic_name": "",
            "clinic_address": "",
            "bio": "",
            "ratings": []
        }
        doctors.append(profile)
        save_json(DOCTORS_FILE, doctors)
    return profile


def avg_rating(ratings):
    if not ratings:
        return 0.0
    return round(sum(r["score"] for r in ratings) / len(ratings), 1)


# ── Doctor profile endpoints ──────────────────────────────────────────────────

@doctor_bp.route("/api/doctors", methods=["GET"])
def list_doctors():
    """Return all doctor profiles (registered doctor accounts + their profile data)."""
    try:
        accounts = load_json(ACCOUNTS_FILE)
        doctors = load_json(DOCTORS_FILE)

        doctor_accounts = [a for a in accounts if a.get("role") == "doctor"]
        result = []
        for acc in doctor_accounts:
            profile = next((d for d in doctors if d["email"] == acc["email"]), {})
            result.append({
                "email": acc["email"],
                "username": acc.get("username", ""),
                "name": profile.get("name") or acc.get("username", ""),
                "specialization": profile.get("specialization", ""),
                "clinic_name": profile.get("clinic_name", ""),
                "clinic_address": profile.get("clinic_address", ""),
                "bio": profile.get("bio", ""),
                "rating_avg": avg_rating(profile.get("ratings", [])),
                "rating_count": len(profile.get("ratings", []))
            })
        return jsonify({"doctors": result}), 200

    except Exception:
        return jsonify({"error": "Internal server error."}), 500


@doctor_bp.route("/api/doctors/<path:email>", methods=["GET"])
def get_doctor(email):
    """Return a single doctor's full profile including ratings (anonymised)."""
    try:
        email = email.strip().lower()
        accounts = load_json(ACCOUNTS_FILE)
        acc = next((a for a in accounts if a["email"] == email and a.get("role") == "doctor"), None)
        if not acc:
            return jsonify({"error": "Doctor not found."}), 404

        profile = get_or_create_doctor_profile(email)

        # Anonymise ratings (show initials only)
        anon_ratings = []
        for r in profile.get("ratings", []):
            pe = r.get("parent_email", "?")
            parts = pe.split("@")[0].split(".")
            initials = ".".join(p[0].upper() for p in parts if p) + "."
            anon_ratings.append({
                "initials": initials,
                "score": r["score"],
                "comment": r.get("comment", ""),
                "timestamp": r.get("timestamp", "")
            })

        return jsonify({
            "email": email,
            "username": acc.get("username", ""),
            "name": profile.get("name") or acc.get("username", ""),
            "specialization": profile.get("specialization", ""),
            "clinic_name": profile.get("clinic_name", ""),
            "clinic_address": profile.get("clinic_address", ""),
            "bio": profile.get("bio", ""),
            "rating_avg": avg_rating(profile.get("ratings", [])),
            "rating_count": len(profile.get("ratings", [])),
            "ratings": anon_ratings
        }), 200

    except Exception:
        return jsonify({"error": "Internal server error."}), 500


@doctor_bp.route("/api/doctors/profile", methods=["POST"])
def update_doctor_profile():
    """Create or update the authenticated doctor's profile."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        email = data.get("email", "").strip().lower()
        if not email:
            return jsonify({"error": "Email is required."}), 400

        doctors = load_json(DOCTORS_FILE)
        profile = next((d for d in doctors if d["email"] == email), None)

        if not profile:
            profile = {"email": email, "ratings": []}
            doctors.append(profile)

        profile["name"] = data.get("name", profile.get("name", "")).strip()
        profile["specialization"] = data.get("specialization", profile.get("specialization", "")).strip()
        profile["clinic_name"] = data.get("clinic_name", profile.get("clinic_name", "")).strip()
        profile["clinic_address"] = data.get("clinic_address", profile.get("clinic_address", "")).strip()
        profile["bio"] = data.get("bio", profile.get("bio", "")).strip()

        save_json(DOCTORS_FILE, doctors)
        return jsonify({"message": "Profile updated.", "profile": profile}), 200

    except Exception:
        return jsonify({"error": "Internal server error."}), 500


@doctor_bp.route("/api/doctors/rate", methods=["POST"])
def rate_doctor():
    """Parent submits or updates a rating for a doctor."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        doctor_email = data.get("doctor_email", "").strip().lower()
        parent_email = data.get("parent_email", "").strip().lower()
        score = data.get("score")
        comment = data.get("comment", "").strip()

        if not doctor_email or not parent_email:
            return jsonify({"error": "doctor_email and parent_email are required."}), 400
        if not isinstance(score, (int, float)) or not (1 <= score <= 5):
            return jsonify({"error": "Score must be between 1 and 5."}), 400

        doctors = load_json(DOCTORS_FILE)
        profile = next((d for d in doctors if d["email"] == doctor_email), None)
        if not profile:
            profile = {"email": doctor_email, "ratings": []}
            doctors.append(profile)

        # Update existing rating or append new one
        existing = next((r for r in profile["ratings"] if r["parent_email"] == parent_email), None)
        if existing:
            existing["score"] = score
            existing["comment"] = comment
            existing["timestamp"] = datetime.now(timezone.utc).isoformat()
        else:
            profile["ratings"].append({
                "parent_email": parent_email,
                "score": score,
                "comment": comment,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

        save_json(DOCTORS_FILE, doctors)
        return jsonify({"message": "Rating submitted.", "new_avg": avg_rating(profile["ratings"])}), 200

    except Exception:
        return jsonify({"error": "Internal server error."}), 500


# ── Patient data for doctor dashboard ────────────────────────────────────────

@doctor_bp.route("/api/patients", methods=["GET"])
def get_patients():
    """Return all parent accounts with their full result history."""
    try:
        accounts = load_json(ACCOUNTS_FILE)
        results = load_json(RESULTS_FILE)

        parent_accounts = [a for a in accounts if a.get("role", "parent") == "parent"]
        patients = []
        for acc in parent_accounts:
            email = acc["email"]
            user_results = sorted(
                [r for r in results if r.get("email") == email],
                key=lambda r: r.get("timestamp", ""),
                reverse=True
            )
            last = user_results[0] if user_results else None
            patients.append({
                "email": email,
                "username": acc.get("username", email.split("@")[0]),
                "total_screenings": len(user_results),
                "last_screened": last["timestamp"] if last else None,
                "last_likelihood": last["likelihood"] if last else None,
                "last_social": last["social_percent"] if last else None,
                "last_behavioral": last["behavioral_percent"] if last else None,
                "last_flags": last["critical_flags"] if last else None,
                "last_interpretation": last["interpretation"] if last else None,
                "results": user_results   # full history
            })

        return jsonify({"patients": patients}), 200

    except Exception:
        return jsonify({"error": "Internal server error."}), 500
