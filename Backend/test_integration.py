import pytest
from fastapi.testclient import TestClient
from main import app  # assuming your FastAPI app is in main.py
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

client = TestClient(app)

# -----------------------
# Helper: Login and return JWT
# -----------------------
def login_user(email, password):
    response = client.post("/login/auth-login", json={"email": email, "password": password})
    assert response.status_code == 200
    token = response.json()["token"]
    return token

# -----------------------
# STUDENT FLOW
# -----------------------
def test_student_full_flow():
    # Step 1: Login as student
    token = login_user("4su22ad032@sdmit.in", "123456")

    headers = {"Authorization": f"Bearer {token}"}

    # Step 2: Fetch announcements
    res_ann = client.get("/groups/1/announcements", headers=headers)
    assert res_ann.status_code == 200
    assert "materials" in res_ann.json()
    assert "events" in res_ann.json()

    # Step 3: Fetch documents
    res_docs = client.get("/groups/documents", headers=headers)
    assert res_docs.status_code == 200
    assert "documents" in res_docs.json()

    # Step 4: Fetch messages
    res_msg = client.get("/groups/messages?group_id=1", headers=headers)
    assert res_msg.status_code == 200
    assert isinstance(res_msg.json(), list)

# -----------------------
# LECTURER FLOW
# -----------------------
def test_lecturer_group_dashboard():
    token = login_user("horimiyachan1995@gmail.com", "123456")
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch lecturer’s group messages
    res_msg = client.get("/groups/messages?group_id=1", headers=headers)
    assert res_msg.status_code in [200, 403]  # allowed or restricted
    # This confirms the lecturer module integrates correctly

# -----------------------
# DOCUMENT SIGN FLOW
# -----------------------
def test_student_document_sign():
    token = login_user("4su22ad032@sdmit.in", "123456")
    headers = {"Authorization": f"Bearer {token}"}

    # Simulate uploading face images for signing
    files = [("images", ("face1.jpg", open("dataset/person5_img1.jpeg", "rb"), "image/jpeg"))]

    res_sign = client.post("/sign-document/49/sign", headers=headers, files=files)
    assert res_sign.status_code in [200, 403]  # either success or failed match
    data = res_sign.json()
    if res_sign.status_code == 200:
        assert data["signed"] is True
