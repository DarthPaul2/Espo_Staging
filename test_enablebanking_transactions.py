# Что это:
# Тест получения транзакций Enable Banking по account_uid.
#
# Зачем:
# Проверяем, какие банковские движения возвращаются и какие поля доступны
# для будущего CBankbewegung-Import. Ничего в EspoCRM не сохраняем.

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

# ВСТАВЬ сюда uid из accounts[0].uid
ACCOUNT_UID = "14ea653a-886b-4feb-9a23-121ea942b73c"


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
    if ACCOUNT_UID == "PASTE_ACCOUNT_UID_HERE" or not ACCOUNT_UID.strip():
        raise RuntimeError("Сначала вставь ACCOUNT_UID из accounts[0].uid.")

    token = make_jwt()

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    params = {
        "date_from": "2026-05-01",
        "date_to": "2026-05-13",
    }

    response = requests.get(
        f"{API_ORIGIN}/accounts/{ACCOUNT_UID}/transactions",
        headers=headers,
        params=params,
        timeout=30,
    )

    # Что это:
    # Сначала печатаем полный JSON-ответ Enable Banking.
    #
    # Зачем:
    # При Status 422 нужно увидеть точную причину ошибки,
    # а не ошибочно считать, что транзакций просто 0.

    print("Status:", response.status_code)

    try:
        data = response.json()
        print("Raw response:")
        print(json.dumps(data, indent=2, ensure_ascii=False))

        if response.status_code >= 400:
            return

        transactions = data.get("transactions", [])

        print("Transactions count:", len(transactions))

        safe_preview = []
        for tx in transactions[:5]:
            safe_preview.append(
                {
                    "entry_reference": tx.get("entry_reference"),
                    "transaction_amount": tx.get("transaction_amount"),
                    "credit_debit_indicator": tx.get("credit_debit_indicator"),
                    "booking_date": tx.get("booking_date"),
                    "value_date": tx.get("value_date"),
                    "remittance_information_present": bool(
                        tx.get("remittance_information")
                    ),
                    "status": tx.get("status"),
                    "bank_transaction_code": tx.get("bank_transaction_code"),
                    "creditor_present": bool(tx.get("creditor")),
                    "debtor_present": bool(tx.get("debtor")),
                    "creditor_account_present": bool(tx.get("creditor_account")),
                    "debtor_account_present": bool(tx.get("debtor_account")),
                }
            )

        print(json.dumps(safe_preview, indent=2, ensure_ascii=False))

    except Exception:
        print(response.text)


if __name__ == "__main__":
    main()
