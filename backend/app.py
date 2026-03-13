from flask import Flask
from flask_cors import CORS

from routes.questionnaire_routes import questionnaire_bp
from routes.auth_routes import auth_bp
from routes.result_routes import result_bp
from routes.doctor_routes import doctor_bp

app = Flask(__name__)
CORS(app)

# Register routes
app.register_blueprint(questionnaire_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(result_bp)
app.register_blueprint(doctor_bp)

if __name__ == "__main__":
    app.run(debug=True)