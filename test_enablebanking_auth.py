# Что это:
# Создаёт Enable Banking authorisation URL.
#
# Зачем:
# Через эту ссылку пользователь подтверждает доступ к счёту,
# после чего Enable Banking вернёт нас на callback URL с параметром code.

import json
import time
import uuid
from pathlib import Path

import jwt
import requests

API_ORIGIN = "https://api.enablebanking.com"

APPLICATION_ID = "32ead842-7070-4157-a430-3fbb4b3984c6"
PRIVATE_KEY_PATH = Path(
    "/var/www/espocrm-staging/secure/enablebanking/"
    "32ead842-7070-4157-a430-3fbb4b3984c6.pem"
)

REDIRECT_URL = "https://klesec.pagekite.me/api/enablebanking/callback"


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
    token = make_jwt()

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    body = {
        "access": {"valid_until": "2026-08-13T23:59:59+00:00"},
        "aspsp": {"country": "DE", "name": "Niederrheinische Sparkasse RheinLippe"},
        "state": str(uuid.uuid4()),
        "redirect_url": REDIRECT_URL,
        "psu_type": "personal",
    }

    response = requests.post(
        f"{API_ORIGIN}/auth",
        headers=headers,
        json=body,
        timeout=30,
    )

    print("Status:", response.status_code)

    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))

        url = data.get("url") or data.get("redirect_url") or data.get("auth_url")
        if url:
            print("\nOPEN THIS URL IN BROWSER:")
            print(url)

    except Exception:
        print(response.text)


if __name__ == "__main__":
    main()
