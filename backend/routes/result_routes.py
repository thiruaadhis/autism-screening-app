import json
import os
import uuid
from flask import Blueprint, request, jsonify

result_bp = Blueprint("results", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_FILE = os.path.join(BASE_DIR, "../data/results.json")
ACCOUNTS_FILE = os.path.join(BASE_DIR, "../data/accounts.json")

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

def load_accounts():
    if not os.path.exists(ACCOUNTS_FILE):
        return []
    with open(ACCOUNTS_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_accounts(data):
    os.makedirs(os.path.dirname(ACCOUNTS_FILE), exist_ok=True)
    with open(ACCOUNTS_FILE, "w") as f:
        json.dump(data, f, indent=4)


@result_bp.route("/api/results", methods=["GET"])
def get_results():
    """Get all screening results for a specific user."""
    try:
        email = request.args.get("email", "").strip()
        if not email:
            return jsonify({"error": "Email is required."}), 400

        results = load_results()
        user_results = [r for r in results if r.get("email") == email]

        # Sort by timestamp descending (newest first)
        user_results.sort(key=lambda r: r.get("timestamp", ""), reverse=True)

        return jsonify({"results": user_results})

    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500


@result_bp.route("/api/results/<result_id>", methods=["DELETE"])
def delete_result(result_id):
    """Delete a single screening result by its ID."""
    try:
        results = load_results()
        original_len = len(results)
        results = [r for r in results if r.get("id") != result_id]

        if len(results) == original_len:
            return jsonify({"error": "Result not found."}), 404

        save_results(results)
        return jsonify({"message": "Result deleted."}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500


@result_bp.route("/api/purge", methods=["POST"])
def purge_user_data():
    """Purge all user data except email and password."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        email = data.get("email", "").strip()
        if not email:
            return jsonify({"error": "Email is required."}), 400

        # 1. Delete all results for this user
        results = load_results()
        results = [r for r in results if r.get("email") != email]
        save_results(results)

        # 2. Strip username from account (keep only email + password)
        accounts = load_accounts()
        for acc in accounts:
            if acc["email"] == email:
                acc.pop("username", None)
                break
        save_accounts(accounts)

        return jsonify({"message": "All user data purged. Email and password retained."}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500
