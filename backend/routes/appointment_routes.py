import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from utils import load_json, save_json

appointment_bp = Blueprint("appointments", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APPOINTMENTS_FILE = os.path.join(BASE_DIR, "../data/appointments.json")
ACCOUNTS_FILE = os.path.join(BASE_DIR, "../data/accounts.json")
DOCTORS_FILE = os.path.join(BASE_DIR, "../data/doctors.json")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ── Book an appointment (parent) ──────────────────────────────────────────────

@appointment_bp.route("/api/appointments", methods=["POST"])
def book_appointment():
    """Parent books an appointment with a doctor."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        parent_email = data.get("parent_email", "").strip().lower()
        doctor_email = data.get("doctor_email", "").strip().lower()
        reason = data.get("reason", "").strip()
        requested_date = data.get("requested_date", "").strip()

        if not parent_email or not doctor_email:
            return jsonify({"error": "parent_email and doctor_email are required."}), 400

        # Verify doctor exists
        accounts = load_json(ACCOUNTS_FILE)
        doctor_acc = next((a for a in accounts if a["email"] == doctor_email and a.get("role") == "doctor"), None)
        if not doctor_acc:
            return jsonify({"error": "Doctor not found."}), 404

        # Resolve doctor display name
        doctors = load_json(DOCTORS_FILE)
        doc_profile = next((d for d in doctors if d["email"] == doctor_email), {})
        doctor_name = doc_profile.get("name") or doctor_acc.get("username", doctor_email)

        # Resolve parent display name
        parent_acc = next((a for a in accounts if a["email"] == parent_email), {})
        parent_name = parent_acc.get("username", parent_email.split("@")[0])

        appointments = load_json(APPOINTMENTS_FILE)

        appointment = {
            "id": str(uuid.uuid4()),
            "parent_email": parent_email,
            "parent_name": parent_name,
            "doctor_email": doctor_email,
            "doctor_name": doctor_name,
            "reason": reason,
            "requested_date": requested_date,
            "status": "pending",
            "rejection_reason": "",
            "created_at": now_iso(),
            "updated_at": now_iso()
        }

        appointments.append(appointment)
        save_json(APPOINTMENTS_FILE, appointments)

        return jsonify({"message": "Appointment booked.", "appointment": appointment}), 201

    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500


# ── Get appointments ──────────────────────────────────────────────────────────

@appointment_bp.route("/api/appointments", methods=["GET"])
def get_appointments():
    """
    Fetch appointments for a parent or doctor.
    Query params: email, role (parent|doctor)
    """
    try:
        email = request.args.get("email", "").strip().lower()
        role = request.args.get("role", "parent").strip().lower()

        if not email:
            return jsonify({"error": "email is required."}), 400

        appointments = load_json(APPOINTMENTS_FILE)

        if role == "doctor":
            result = [a for a in appointments if a.get("doctor_email") == email]
        else:
            result = [a for a in appointments if a.get("parent_email") == email]

        # Sort newest first
        result = sorted(result, key=lambda a: a.get("created_at", ""), reverse=True)
        return jsonify({"appointments": result}), 200

    except Exception:
        return jsonify({"error": "Internal server error."}), 500


# ── Doctor responds (approve / reject) ────────────────────────────────────────

@appointment_bp.route("/api/appointments/<appointment_id>/respond", methods=["POST"])
def respond_appointment(appointment_id):
    """Doctor approves or rejects an appointment."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        action = data.get("action", "").strip().lower()   # "approved" or "rejected"
        rejection_reason = data.get("rejection_reason", "").strip()
        doctor_email = data.get("doctor_email", "").strip().lower()

        if action not in ("approved", "rejected"):
            return jsonify({"error": "action must be 'approved' or 'rejected'."}), 400
        if action == "rejected" and not rejection_reason:
            return jsonify({"error": "rejection_reason is required when rejecting."}), 400

        appointments = load_json(APPOINTMENTS_FILE)
        appt = next((a for a in appointments if a["id"] == appointment_id), None)

        if not appt:
            return jsonify({"error": "Appointment not found."}), 404
        if appt.get("doctor_email") != doctor_email:
            return jsonify({"error": "Unauthorized."}), 403

        appt["status"] = action
        appt["rejection_reason"] = rejection_reason if action == "rejected" else ""
        appt["updated_at"] = now_iso()

        save_json(APPOINTMENTS_FILE, appointments)
        return jsonify({"message": f"Appointment {action}.", "appointment": appt}), 200

    except Exception:
        return jsonify({"error": "Internal server error."}), 500


# ── Parent cancels a pending appointment ─────────────────────────────────────

@appointment_bp.route("/api/appointments/<appointment_id>", methods=["DELETE"])
def cancel_appointment(appointment_id):
    """Parent cancels a pending appointment."""
    try:
        appointments = load_json(APPOINTMENTS_FILE)
        appt = next((a for a in appointments if a["id"] == appointment_id), None)

        if not appt:
            return jsonify({"error": "Appointment not found."}), 404
        if appt.get("status") != "pending":
            return jsonify({"error": "Only pending appointments can be cancelled."}), 400

        appointments = [a for a in appointments if a["id"] != appointment_id]
        save_json(APPOINTMENTS_FILE, appointments)

        return jsonify({"message": "Appointment cancelled."}), 200

    except Exception:
        return jsonify({"error": "Internal server error."}), 500
