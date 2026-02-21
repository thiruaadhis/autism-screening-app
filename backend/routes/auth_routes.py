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

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    accounts = load_accounts()

    if any(acc["email"] == email for acc in accounts):
        return jsonify({"error": "Account already exists"}), 400

    accounts.append({"email": email, "password": password})
    save_accounts(accounts)

    return jsonify({"message": "Account created"})

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    accounts = load_accounts()

    for acc in accounts:
        if acc["email"] == email:
            if acc["password"] == password:
                return jsonify({"success": True})
            else:
                return jsonify({"error": "Wrong password"}), 401

    return jsonify({"error": "Account not found"}), 404