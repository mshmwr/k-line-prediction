"""
Tests for POST /api/auth and GET /api/business-logic endpoints.
Covers AC-AUTH-1, AC-AUTH-2, AC-AUTH-4.
"""
import time
import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_client(monkeypatch):
    """Import app after env vars are set (lazy-loading requirement)."""
    monkeypatch.setenv("BUSINESS_LOGIC_PASSWORD", "test-pass")
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    # Import here so module-level code in main.py sees the env vars
    import importlib
    import sys
    # Reload modules to pick up env vars set by monkeypatch
    for mod_name in ["auth", "main"]:
        if mod_name in sys.modules:
            del sys.modules[mod_name]
    import main
    return TestClient(main.app)


# ---------------------------------------------------------------------------
# AC-AUTH-1: 正確密碼 → 200 + JWT token
# ---------------------------------------------------------------------------

def test_correct_password_returns_jwt(monkeypatch):
    """
    Given: BUSINESS_LOGIC_PASSWORD env var is 'test-pass' and JWT_SECRET is 'test-secret'
    When:  POST /api/auth with { "password": "test-pass" }
    Then:  Response is 200, body contains 'token', JWT payload has sub='business-logic-access' and exp > now
    """
    from jose import jwt as jose_jwt

    client = _make_client(monkeypatch)
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

def test_wrong_password_returns_401(monkeypatch):
    """
    Given: BUSINESS_LOGIC_PASSWORD env var is 'test-pass'
    When:  POST /api/auth with { "password": "wrong-pass" }
    Then:  Response is 401
    """
    client = _make_client(monkeypatch)
    response = client.post("/api/auth", json={"password": "wrong-pass"})

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# AC-AUTH-4: 過期 token 打 GET /api/business-logic → 401
# ---------------------------------------------------------------------------

def test_expired_token_returns_401(monkeypatch):
    """
    Given: A JWT token whose 'exp' is in the past
    When:  GET /api/business-logic with Authorization: Bearer <expired_token>
    Then:  Response is 401
    """
    from jose import jwt as jose_jwt

    client = _make_client(monkeypatch)

    # Build an already-expired token
    now = int(time.time())
    expired_payload = {
        "sub": "business-logic-access",
        "iat": now - 200000,
        "exp": now - 100000,  # expired 100,000 seconds ago
    }
    expired_token = jose_jwt.encode(expired_payload, "test-secret", algorithm="HS256")

    response = client.get(
        "/api/business-logic",
        headers={"Authorization": f"Bearer {expired_token}"},
    )

    assert response.status_code == 401
