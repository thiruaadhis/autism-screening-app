import os
import uuid
from flask import Blueprint, request, jsonify
from utils import load_json, save_json

result_bp = Blueprint("results", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_FILE = os.path.join(BASE_DIR, "../data/results.json")
ACCOUNTS_FILE = os.path.join(BASE_DIR, "../data/accounts.json")


@result_bp.route("/api/results", methods=["GET"])
def get_results():
    """Get all screening results for a specific user."""
    try:
        email = request.args.get("email", "").strip()
        if not email:
            return jsonify({"error": "Email is required."}), 400

        results = load_json(RESULTS_FILE)
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
        results = load_json(RESULTS_FILE)
        original_len = len(results)
        results = [r for r in results if r.get("id") != result_id]

        if len(results) == original_len:
            return jsonify({"error": "Result not found."}), 404

        save_json(RESULTS_FILE, results)
        return jsonify({"message": "Result deleted."}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500


@result_bp.route("/api/purge", methods=["POST"])
def purge_user_data():
    """Purge all results for a user. Optionally delete their entire account."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        email = data.get("email", "").strip()
        delete_account = data.get("delete_account", False)

        if not email:
            return jsonify({"error": "Email is required."}), 400

        # 1. Delete all results for this user
        results = load_json(RESULTS_FILE)
        results = [r for r in results if r.get("email") != email]
        save_json(RESULTS_FILE, results)

        # 2a. Full account deletion
        if delete_account:
            accounts = load_json(ACCOUNTS_FILE)
            accounts = [acc for acc in accounts if acc["email"] != email]
            save_json(ACCOUNTS_FILE, accounts)
            return jsonify({"message": "Account and all data permanently deleted."}), 200

        # 2b. Strip only the username (keep email + password)
        accounts = load_json(ACCOUNTS_FILE)
        for acc in accounts:
            if acc["email"] == email:
                acc.pop("username", None)
                break
        save_json(ACCOUNTS_FILE, accounts)

        return jsonify({"message": "All screening data purged. Account credentials retained."}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500
