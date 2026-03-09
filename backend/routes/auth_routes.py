import json
import os
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint("auth", __name__)

# Bulletproof pathing: dynamically finds the data folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(BASE_DIR, "../data/accounts.json")

def load_accounts():
    if not os.path.exists(FILE):
        return []
    with open(FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return [] # Returns empty if the file is corrupted or completely blank

def save_accounts(data):
    # Ensure the directory exists before saving
    os.makedirs(os.path.dirname(FILE), exist_ok=True)
    with open(FILE, "w") as f:
        json.dump(data, f, indent=4)

def is_hashed(password_value):
    """Check if a stored password is already a werkzeug hash."""
    return password_value.startswith("pbkdf2:") or password_value.startswith("scrypt:")

# Notice we added /api/ to match the frontend fetch command
@auth_bp.route("/api/signup", methods=["POST"])
def signup():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        email = data.get("email", "").strip()
        password = data.get("password", "")
        username = data.get("username", "").strip()

        # Input validation
        if not email or not password or not username:
            return jsonify({"error": "Email, password, and username are required."}), 400

        accounts = load_accounts()

        if any(acc["email"] == email for acc in accounts):
            # This exact string triggers the frontend red box!
            return jsonify({"error": "Account already exists."}), 400

        # Hash the password before storing
        hashed_password = generate_password_hash(password)

        accounts.append({"email": email, "password": hashed_password, "username": username})
        save_accounts(accounts)

        return jsonify({"message": "Account created", "email": email, "username": username}), 201

    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500

@auth_bp.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        email = data.get("email", "").strip()
        password = data.get("password", "")

        # Input validation
        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400

        accounts = load_accounts()

        # Find the user in the database
        user = next((acc for acc in accounts if acc["email"] == email), None)

        if not user:
            # This triggers the "Create Account" modal in the frontend
            return jsonify({"error": "Account not found"}), 404

        stored_password = user["password"]

        # Backward compat: support existing plain-text passwords and auto-migrate
        if is_hashed(stored_password):
            password_matches = check_password_hash(stored_password, password)
        else:
            # Legacy plain-text comparison — migrate on success
            password_matches = (stored_password == password)

        if password_matches:
            # Auto-migrate plain-text passwords to hashed
            if not is_hashed(stored_password):
                user["password"] = generate_password_hash(password)
                save_accounts(accounts)

            # Success! Send the username back so the dashboard can display it
            return jsonify({
                "success": True, 
                "email": email, 
                "username": user.get("username", email.split('@')[0])
            }), 200
        else:
            # This exact string triggers the wrong password red box!
            return jsonify({"error": "Wrong password."}), 401

    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500