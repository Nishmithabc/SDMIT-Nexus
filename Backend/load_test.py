from locust import HttpUser, task, between
import random

class SDMITNexusUser(HttpUser):
    wait_time = between(1, 3)  # seconds between requests

    def on_start(self):
        """Login once when each simulated user starts"""
        login_payload = {
            "email": "4su22ad032@sdmit.in",
            "password": "123456"
        }
        with self.client.post("/login/auth-login", json=login_payload, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                self.token = data["token"]
                self.group_id = data["user"]["group_id"]
                self.headers = {"Authorization": f"Bearer {self.token}"}
                response.success()
            else:
                response.failure(f"Login failed: {response.text}")

    @task(3)
    def fetch_messages(self):
        """Simulate fetching group messages"""
        self.client.get(
            f"/groups/messages?group_id={self.group_id}",
            headers=self.headers,
            name="/groups/messages"
        )

    @task(2)
    def fetch_announcements(self):
        """Simulate fetching announcements"""
        self.client.get(
            f"/groups/{self.group_id}/announcements",
            headers=self.headers,
            name="/groups/announcements"
        )

    @task(1)
    def fetch_documents(self):
        """Simulate fetching group documents"""
        self.client.get(
            "/groups/documents",
            headers=self.headers,
            name="/groups/documents"
        )

    @task(1)
    def sign_document(self):
        """Simulate signing a document"""
        document_id = 49  # choose existing doc IDs in your DB
        try:
            with open("dataset/person5_img1.jpeg", "rb") as f:
                files = [
                    ("images", ("dataset/person5_img1.jpeg", f, "image/jpeg")),
                ]
                self.client.post(
                    f"/sign-document/{document_id}/sign",
                    headers=self.headers,
                    files=files,
                    name="/sign-dcument/sign"
                )
        except FileNotFoundError:
            print("⚠️ face_sample.jpg not found! Place it in the same directory as this script.")
