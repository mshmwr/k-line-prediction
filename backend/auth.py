"""
auth.py — JWT Authentication Router

Endpoints:
  POST /auth         — 密碼驗證，回傳 JWT token
  GET  /business-logic — 驗證 JWT，回傳 business_logic.md 內容
"""
import hmac
import os
import time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from models import AuthRequest, AuthResponse

router = APIRouter()
_bearer = HTTPBearer()


# ---------------------------------------------------------------------------
# JWT dependency
# ---------------------------------------------------------------------------

def require_jwt(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    """Verify Bearer token; raise 401 on any error."""
    secret = os.environ.get("JWT_SECRET", "")
    try:
        payload = jwt.decode(
            credentials.credentials,
            secret,
            algorithms=["HS256"],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return payload


# ---------------------------------------------------------------------------
# POST /auth
# ---------------------------------------------------------------------------

@router.post("/auth", response_model=AuthResponse)
def login(req: AuthRequest) -> AuthResponse:
    """
    Given a password, validate against BUSINESS_LOGIC_PASSWORD env var.
    Return a signed JWT on success, 401 on failure.
    """
    expected = os.environ.get("BUSINESS_LOGIC_PASSWORD", "")
    secret = os.environ.get("JWT_SECRET", "")

    # timing-safe comparison
    if not hmac.compare_digest(req.password.encode(), expected.encode()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
        )

    now = int(time.time())
    payload = {
        "sub": "business-logic-access",
        "iat": now,
        "exp": now + 86400,
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    return AuthResponse(token=token)


# ---------------------------------------------------------------------------
# GET /business-logic
# ---------------------------------------------------------------------------

@router.get("/business-logic")
def get_business_logic(_payload: dict = Depends(require_jwt)) -> dict:
    """
    Return the contents of business_logic.md.
    Requires a valid JWT Bearer token.
    """
    md_path = Path(__file__).parent / "business_logic.md"
    if not md_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="business_logic.md not found",
        )
    content = md_path.read_text(encoding="utf-8")
    return {"content": content}
