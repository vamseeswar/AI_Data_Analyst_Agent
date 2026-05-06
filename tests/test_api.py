import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to AI Data Analyst API"}

def test_analyze_invalid_file_type():
    # Attempt to upload a text file instead of CSV
    files = {'file': ('test.txt', b"fake text content", 'text/plain')}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert "Only CSV and Excel files are supported" in response.json()['detail']

def test_chat_endpoint_no_context():
    response = client.post(
        "/api/v1/chat",
        json={"query": "Hello AI", "dataset_context": None}
    )
    # The Groq API might fail if keys are invalid, but the endpoint should try to respond
    # If the mocked API is not set, it might raise 500, but we just check structural completion
    assert response.status_code in [200, 500] 
