# Что это:
# Тест доступных Enable Banking API endpoints после linked account.
#
# Зачем:
# Проверяем, можем ли мы увидеть session/account данные по уже linked account
# из restricted production application. Ничего в EspoCRM не сохраняем.

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


def request_json(method: str, path: str, **kwargs):
    token = make_jwt()

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    if "json" in kwargs:
        headers["Content-Type"] = "application/json"

    response = requests.request(
        method,
        f"{API_ORIGIN}{path}",
        headers=headers,
        timeout=30,
        **kwargs,
    )

    print("\n==============================")
    print(method, path)
    print("Status:", response.status_code)

    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
        return response.status_code, data
    except Exception:
        print(response.text)
        return response.status_code, response.text


def main() -> None:
    # Проверяем application ещё раз.
    request_json("GET", "/application")

    # Пробуем посмотреть sessions.
    # Если endpoint не поддерживает GET, увидим понятную ошибку.
    request_json("GET", "/sessions")


if __name__ == "__main__":
    main()
