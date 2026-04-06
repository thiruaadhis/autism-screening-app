"""
WSGI entry point for PythonAnywhere.

In the PythonAnywhere Web tab:
  - Source code:      /home/<username>/autism-screening
  - Working directory:/home/<username>/autism-screening/backend
  - WSGI config file: /home/<username>/autism-screening/wsgi.py
  - Python version:   3.10 (or whatever is available)
"""
import sys
import os

# Add the backend directory to the Python path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app import app as application  # PythonAnywhere expects the name "application"
