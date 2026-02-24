import json
import os
from flask import Blueprint, request, jsonify

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

# Notice we added /api/ to match the frontend fetch command
@auth_bp.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    username = data.get("username") # Extracting the username the JS sent!

    accounts = load_accounts()

    if any(acc["email"] == email for acc in accounts):
        # This exact string triggers the frontend red box!
        return jsonify({"error": "Account already exists."}), 400

    accounts.append({"email": email, "password": password, "username": username})
    save_accounts(accounts)

    return jsonify({"message": "Account created", "email": email, "username": username}), 201

@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    accounts = load_accounts()

    # Find the user in the database
    user = next((acc for acc in accounts if acc["email"] == email), None)

    if not user:
        # This triggers the "Create Account" modal in the frontend
        return jsonify({"error": "Account not found"}), 404

    if user["password"] == password:
        # Success! Send the username back so the dashboard can display it
        return jsonify({
            "success": True, 
            "email": email, 
            "username": user.get("username", email.split('@')[0])
        }), 200
    else:
        # This exact string triggers the wrong password red box!
        return jsonify({"error": "Wrong password."}), 401