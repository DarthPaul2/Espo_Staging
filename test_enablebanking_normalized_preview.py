# Что это:
# Безопасный preview банковских движений Enable Banking.
#
# Зачем:
# Проверяем данные для будущего CBankbewegung-Import,
# но не выводим IBAN, имена контрагентов и полный Verwendungszweck.

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

# ВСТАВЬ сюда uid из accounts[0].uid.
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


def normalize_direction(indicator: str) -> str:
    if indicator == "CRDT":
        return "eingang"
    if indicator == "DBIT":
        return "ausgang"
    return "unbekannt"


def normalize_transaction(tx: dict) -> dict:
    amount = tx.get("transaction_amount") or {}
    bank_code = tx.get("bank_transaction_code") or {}
    remittance = tx.get("remittance_information") or []

    return {
        "buchungstag": tx.get("booking_date"),
        "valutadatum": tx.get("value_date"),
        "richtung": normalize_direction(tx.get("credit_debit_indicator")),
        "betrag": amount.get("amount"),
        "waehrung": amount.get("currency"),
        "status": tx.get("status"),
        "bankTyp": bank_code.get("description"),
        "referenzVorhanden": bool(tx.get("entry_reference")),
        "gegenparteiVorhanden": bool(tx.get("creditor") or tx.get("debtor")),
        "gegenkontoVorhanden": bool(
            tx.get("creditor_account") or tx.get("debtor_account")
        ),
        "verwendungszweckVorhanden": bool(remittance),
        "verwendungszweckZeilen": len(remittance),
    }


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

    print("Status:", response.status_code)

    data = response.json()

    if response.status_code >= 400:
        print(json.dumps(data, indent=2, ensure_ascii=False))
        return

    transactions = data.get("transactions", [])

    normalized = [normalize_transaction(tx) for tx in transactions]

    print("Transactions count:", len(normalized))
    print(json.dumps(normalized, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
