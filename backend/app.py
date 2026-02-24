from flask import Flask
from flask_cors import CORS

from routes.questionnaire_routes import questionnaire_bp
from routes.auth_routes import auth_bp

app = Flask(__name__)

# This is the magic bridge that allows Live Server (5500) to talk to Flask (5000)
CORS(app)

# Register routes
app.register_blueprint(questionnaire_bp)
app.register_blueprint(auth_bp)

if __name__ == "__main__":
    app.run(debug=True)