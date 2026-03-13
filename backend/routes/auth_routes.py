import os
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from utils import load_json, save_json

auth_bp = Blueprint("auth", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(BASE_DIR, "../data/accounts.json")


def is_hashed(password_value):
    """Check if a stored password is already a werkzeug hash."""
    return password_value.startswith("pbkdf2:") or password_value.startswith("scrypt:")


@auth_bp.route("/api/signup", methods=["POST"])
def signup():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        username = data.get("username", "").strip()
        role = data.get("role", "parent").strip().lower()

        if role not in ("parent", "doctor"):
            return jsonify({"error": "Role must be 'parent' or 'doctor'."}), 400

        if not email or not password or not username:
            return jsonify({"error": "Email, password, and username are required."}), 400

        accounts = load_json(FILE)

        if any(acc["email"] == email for acc in accounts):
            return jsonify({"error": "Account already exists."}), 400

        hashed_password = generate_password_hash(password)
        accounts.append({
            "email": email,
            "password": hashed_password,
            "username": username,
            "role": role
        })
        save_json(FILE, accounts)

        return jsonify({"message": "Account created", "email": email, "username": username, "role": role}), 201

    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500


@auth_bp.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400

        accounts = load_json(FILE)
        user = next((acc for acc in accounts if acc["email"] == email), None)

        if not user:
            return jsonify({"error": "Account not found"}), 404

        stored_password = user["password"]

        if is_hashed(stored_password):
            password_matches = check_password_hash(stored_password, password)
        else:
            password_matches = (stored_password == password)

        if password_matches:
            if not is_hashed(stored_password):
                user["password"] = generate_password_hash(password)
                save_json(FILE, accounts)

            return jsonify({
                "success": True,
                "email": email,
                "username": user.get("username", email.split('@')[0]),
                "role": user.get("role", "parent")
            }), 200
        else:
            return jsonify({"error": "Wrong password."}), 401

    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500