# Что это:
# Временный отдельный Flask-сервис для теста Enable Banking callback.
#
# Зачем:
# Автоматически принимает code от Enable Banking и сразу обменивает его
# через POST /sessions, чтобы исключить ошибку ручного копирования code.

import json
import time
from pathlib import Path

import jwt
import requests
from flask import Flask, request, Response

app = Flask(__name__)

API_ORIGIN = "https://api.enablebanking.com"

APPLICATION_ID = "32ead842-7070-4157-a430-3fbb4b3984c6"
PRIVATE_KEY_PATH = Path(
    "/var/www/espocrm-staging/secure/enablebanking/"
    "32ead842-7070-4157-a430-3fbb4b3984c6.pem"
)


def make_jwt() -> str:
    now = int(time.time())

    payload = {
        "iss": "enablebanking.com",
        "aud": "api.enablebanking.com",
        "iat": now,
        "exp": now + 3600,
    }

    private_key = PRIVATE_KEY_PATH.read_bytes()

    return jwt.encode(
        payload,
        private_key,
        algorithm="RS256",
        headers={"kid": APPLICATION_ID},
    )


@app.route("/api/enablebanking/callback")
def enablebanking_callback():
    code = request.args.get("code")
    state = request.args.get("state")
    error = request.args.get("error")
    error_description = request.args.get("error_description")

    result = {
        "received": {
            "has_code": bool(code),
            "state": state,
            "error": error,
            "error_description": error_description,
        }
    }

    if not code:
        return Response(
            json.dumps(result, indent=2, ensure_ascii=False),
            mimetype="application/json",
            status=400,
        )

    token = make_jwt()

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    response = requests.post(
        f"{API_ORIGIN}/sessions",
        headers=headers,
        json={"code": code},
        timeout=30,
    )

    try:
        response_data = response.json()
    except Exception:
        response_data = response.text

    result["sessions_response"] = {
        "status": response.status_code,
        "data": response_data,
    }

    return Response(
        json.dumps(result, indent=2, ensure_ascii=False),
        mimetype="application/json",
        status=200,
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5010, debug=False)
