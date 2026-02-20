import json
from flask import Blueprint, request, jsonify

auth_bp = Blueprint("auth", __name__)

FILE = "backend/data/accounts.json"


def load_accounts():
    with open(FILE, "r") as f:
        return json.load(f)


def save_accounts(data):
    with open(FILE, "w") as f:
        json.dump(data, f)


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