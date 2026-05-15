# Что это:
# Минимальный тест Enable Banking API.
#
# Зачем:
# Проверяем, что private key, application ID и авторизация работают.
# Этот тест пока НЕ импортирует данные в EspoCRM и НЕ создаёт Bankbewegungen.

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
    }

    response = requests.get(
        f"{API_ORIGIN}/application",
        headers=headers,
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
