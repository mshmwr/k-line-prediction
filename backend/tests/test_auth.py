import time
import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# AC-AUTH-1: 正確密碼 → 200 + JWT token
# ---------------------------------------------------------------------------

def test_correct_password_returns_jwt(make_client):
    from jose import jwt as jose_jwt

    client = make_client()
    response = client.post("/api/auth", json={"password": "test-pass"})

    assert response.status_code == 200
    body = response.json()
    assert "token" in body

    payload = jose_jwt.decode(body["token"], "test-secret", algorithms=["HS256"])
    assert payload["sub"] == "business-logic-access"
    assert payload["exp"] > int(time.time())


# ---------------------------------------------------------------------------
# AC-AUTH-2: 錯誤密碼 → 401
# ---------------------------------------------------------------------------

def test_wrong_password_returns_401(make_client):
    client = make_client()
    response = client.post("/api/auth", json={"password": "wrong-pass"})

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# AC-AUTH-3: 有效 token → GET /api/business-logic → 200 + content
# ---------------------------------------------------------------------------

def test_valid_token_returns_business_logic(make_client, monkeypatch, tmp_path):
    from jose import jwt as jose_jwt

    client = make_client()

    md_file = tmp_path / "business_logic.md"
    md_file.write_text("# Business Logic\nsome content")
    monkeypatch.setattr("auth.BUSINESS_LOGIC_PATH", md_file)

    now = int(time.time())
    token = jose_jwt.encode(
        {"sub": "business-logic-access", "iat": now, "exp": now + 86400},
        "test-secret",
        algorithm="HS256",
    )

    response = client.get(
        "/api/business-logic",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert "content" in response.json()


# ---------------------------------------------------------------------------
# AC-AUTH-4: 過期 token 打 GET /api/business-logic → 401
# ---------------------------------------------------------------------------

def test_expired_token_returns_401(make_client):
    from jose import jwt as jose_jwt

    client = make_client()

    now = int(time.time())
    expired_payload = {
        "sub": "business-logic-access",
        "iat": now - 200000,
        "exp": now - 100000,
    }
    expired_token = jose_jwt.encode(expired_payload, "test-secret", algorithm="HS256")

    response = client.get(
        "/api/business-logic",
        headers={"Authorization": f"Bearer {expired_token}"},
    )

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# AC-AUTH-5: business_logic.md 不存在 → GET /api/business-logic → 404
# ---------------------------------------------------------------------------

def test_missing_business_logic_file_returns_404(make_client, monkeypatch, tmp_path):
    from jose import jwt as jose_jwt

    client = make_client()

    missing_path = tmp_path / "nonexistent.md"
    monkeypatch.setattr("auth.BUSINESS_LOGIC_PATH", missing_path)

    now = int(time.time())
    token = jose_jwt.encode(
        {"sub": "business-logic-access", "iat": now, "exp": now + 86400},
        "test-secret",
        algorithm="HS256",
    )

    response = client.get(
        "/api/business-logic",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404
