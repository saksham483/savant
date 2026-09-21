from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "sympy_version" in response.json()

def test_verify_math_equivalent():
    # (x + 1)^2 == x^2 + 2x + 1
    resp = client.post("/verify/math", json={
        "user_input": "(x + 1)**2",
        "target_expression": "x**2 + 2*x + 1",
        "variable_names": ["x"]
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["equivalent"] is True

def test_verify_math_trig():
    # sin^2(x) + cos^2(x) == 1
    resp = client.post("/verify/math", json={
        "user_input": "sin(x)**2 + cos(x)**2",
        "target_expression": "1",
        "variable_names": ["x"]
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["equivalent"] is True

def test_verify_math_not_equivalent():
    resp = client.post("/verify/math", json={
        "user_input": "x + 2",
        "target_expression": "x + 3",
        "variable_names": ["x"]
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["equivalent"] is False

def test_verify_code_success():
    code = """
def solve(n):
    return n * (n + 1) // 2
"""
    resp = client.post("/verify/code", json={
        "code": code,
        "function_name": "solve",
        "test_cases": [
            {"input": [1], "expected": 1},
            {"input": [4], "expected": 10},
            {"input": [10], "expected": 55}
        ]
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["all_passed"] is True
    assert data["passed_count"] == 3

def test_verify_code_failure():
    code = """
def solve(n):
    return n * 2
"""
    resp = client.post("/verify/code", json={
        "code": code,
        "function_name": "solve",
        "test_cases": [
            {"input": [1], "expected": 1},
            {"input": [4], "expected": 10}
        ]
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["all_passed"] is False
    assert len(data["failures"]) > 0
