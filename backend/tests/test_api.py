from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "VocaFlow AI"

def test_get_library():
    response = client.get("/api/library")
    assert response.status_code == 200
    tracks = response.json()
    assert isinstance(tracks, list)

def test_settings_api():
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert "storage" in data
    assert "separation_quality" in data

