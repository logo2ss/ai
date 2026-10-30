import os
import pytest
from fastapi.testclient import TestClient
from backend import db
from backend.main import app

@pytest.fixture
def client(tmp_path,monkeypatch):
    monkeypatch.setenv('FOLIO_DISABLE_WORKER','1')
    monkeypatch.setattr(db,'DATA',tmp_path)
    monkeypatch.setattr(db,'DB_PATH',tmp_path/'test.sqlite3')
    with TestClient(app) as client:yield client
