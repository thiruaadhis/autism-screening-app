"""
WSGI entry point for PythonAnywhere.

In the PythonAnywhere Web tab:
  - Source code:      /home/<username>/autism-screening
  - Working directory:/home/<username>/autism-screening/backend
  - WSGI config file: /home/<username>/autism-screening/wsgi.py
  - Python version:   3.10 (or whatever is available)
"""
import sys

# ===================================================================
# INSTRUCTIONS FOR PYTHONANYWHERE:
# 1. Look at the top right of your PythonAnywhere dashboard. 
#    You will see your username.
# 2. Replace the word "your_username_here" below with your ACTUAL
#    PythonAnywhere username.
# 3. Copy ALL the contents of this file and paste it into your 
#    PythonAnywhere WSGI configuration file (accessible from the "Web" tab).
# ===================================================================

# Set your project path here explicitly
project_path = '/home/your_username_here/autism-screening'
backend_path = f'{project_path}/backend'

if project_path not in sys.path:
    sys.path.insert(0, project_path)

if backend_path not in sys.path:
    # Add the backend directory to the Python path so imports work
    sys.path.insert(0, backend_path)

from app import app as application  # PythonAnywhere expects the name "application"
