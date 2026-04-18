import sys
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def make_client(monkeypatch):
    def _make(env_password="test-pass", env_secret="test-secret"):
        monkeypatch.setenv("BUSINESS_LOGIC_PASSWORD", env_password)
        monkeypatch.setenv("JWT_SECRET", env_secret)
        for mod_name in ["auth", "main"]:
            if mod_name in sys.modules:
                del sys.modules[mod_name]
        import main
        return TestClient(main.app)
    return _make
