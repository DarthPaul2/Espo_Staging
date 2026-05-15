# Что это:
# Обмен Enable Banking authorization code на session/accounts.
#
# Зачем:
# После банковской авторизации Enable Banking вернул code в callback URL.
# Этот code нужно один раз отправить в POST /sessions, чтобы получить session_id и accounts.

import json
import time
from pathlib import Path

import jwt
import requests

API_ORIGIN = "https://api.enablebanking.com"

APPLICATION_ID = "32ead842-7070-4157-a430-3fbb4b3984c6"
PRIVATE_KEY_PATH = Path(
    "/var/www/espocrm-staging/secure/enablebanking/"
    "32ead842-7070-4157-a430-3fbb4b3984c6.pem"
)

# ВСТАВЬ сюда code из URL между кавычками.
# После успешного обмена этот code повторно использовать нельзя.
AUTH_CODE = "PASTE_CODE_HERE"


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


def main() -> None:
    if (
        AUTH_CODE
        == "cc12e956-d3a6-4cfd-bd28-9ead93c0931c&code=926c2e3f-a9fd-40b2-95ce-d1d52c83a5f3"
        or not AUTH_CODE.strip()
    ):
        raise RuntimeError("Сначала вставь AUTH_CODE из callback URL.")

    token = make_jwt()

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    body = {"code": AUTH_CODE.strip()}

    response = requests.post(
        f"{API_ORIGIN}/sessions",
        headers=headers,
        json=body,
        timeout=30,
    )

    print("Status:", response.status_code)

    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except Exception:
        print(response.text)


if __name__ == "__main__":
    main()
