import os
from flask import Flask, send_from_directory
from flask_cors import CORS

from routes.questionnaire_routes import questionnaire_bp
from routes.auth_routes import auth_bp
from routes.result_routes import result_bp
from routes.doctor_routes import doctor_bp
from routes.milestone_routes import milestone_bp
from routes.appointment_routes import appointment_bp

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

# ── App ───────────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=None)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── API Blueprints ────────────────────────────────────────────────────────────
app.register_blueprint(questionnaire_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(result_bp)
app.register_blueprint(doctor_bp)
app.register_blueprint(milestone_bp)
app.register_blueprint(appointment_bp)

# ── Serve frontend static assets (css / js / assets) ─────────────────────────
@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, "css"), filename)

@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, "js"), filename)

@app.route("/assets/<path:filename>")
def serve_assets(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, "assets"), filename)

@app.route("/components/<path:filename>")
def serve_components(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, "components"), filename)

# ── Serve HTML pages ──────────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "login.html")

@app.route("/<path:page>")
def serve_page(page):
    """Serve any .html file from the frontend directory."""
    # Strip leading slashes for safety
    safe_page = os.path.basename(page)
    target = os.path.join(FRONTEND_DIR, safe_page)
    if os.path.isfile(target):
        return send_from_directory(FRONTEND_DIR, safe_page)
    # Fallback to login for unknown routes
    return send_from_directory(FRONTEND_DIR, "login.html"), 302

# ── Dev entry point ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)