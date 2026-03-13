import requests
import json

url = "http://127.0.0.1:5000/api/login"
payload = {
    "email": "doc1@gmail.com",
    "password": "pass" # I don't know the password
}
try:
    res = requests.post(url, json=payload)
    print("Status:", res.status_code)
    print("Body:", res.json())
except Exception as e:
    print("Error:", e)
