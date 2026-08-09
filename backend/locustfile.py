import base64
import io
import os

from dotenv import load_dotenv
from locust import HttpUser, between, task

# Credentials are loaded from backend/.env (gitignored).
# Add these two lines to your backend/.env:
#   LOCUST_EMAIL=your-ptrack-account@example.com
#   LOCUST_PASSWORD=your-ptrack-password
#
# Run:
#   locust -f locustfile.py --host=https://ptrack-platform.onrender.com \
#     --headless -u 10 -r 2 -t 60s
load_dotenv()
TEST_EMAIL = os.environ.get("LOCUST_EMAIL", "your-email@example.com")
TEST_PASSWORD = os.environ.get("LOCUST_PASSWORD", "your-password")

# Minimal 10×10 JPEG (~632 bytes) used for report submission tests.
# The backend LRU cache (keyed by MD5 hash) means Gemini is called only once
# for this image; all subsequent locust hits are served from the in-process cache.
_TINY_JPEG_B64 = (
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkM"
    "EQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4I"
    "CA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4e"
    "Hh4eHh7/wAARCAAKAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQF"
    "BgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEI"
    "I0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNk"
    "ZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLD"
    "xMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEB"
    "AQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQ"
    "dhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElK"
    "U1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmq"
    "srO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMB"
    "AAIRAxEAPwDPooorzzyj/9k="
)
_TINY_JPEG = base64.b64decode(_TINY_JPEG_B64)


class PTrackUser(HttpUser):
    wait_time = between(1, 3)
    token = None

    def on_start(self):
        with self.client.post(
            "/api/v1/auth/login/",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            catch_response=True,
        ) as r:
            if r.status_code == 200:
                self.token = r.json().get("access", "")
                r.success()
            else:
                r.failure(f"Login failed {r.status_code}: {r.text[:200]}")
                self.token = None

    def _auth(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(3)
    def get_reports(self):
        self.client.get("/api/v1/reports/", headers=self._auth())

    @task(2)
    def get_leaderboard(self):
        self.client.get("/api/v1/leaderboard/", headers=self._auth())

    @task(1)
    def get_notifications(self):
        self.client.get("/api/v1/notifications/", headers=self._auth())

    @task(1)
    def submit_report(self):
        """POST a waste report with a tiny test image.

        The same image is sent every time so the Gemini LRU cache (keyed by
        MD5 hash) is hit after the first call — no repeated quota consumption.

        Expected outcomes:
        - 201: report saved (test image passed Gemini validity check)
        - 400 invalid_image: Gemini correctly rejected the test image as
          non-waste — the endpoint exercised the full AI path successfully;
          treated as success for load-test purposes.
        """
        with self.client.post(
            "/api/v1/reports/",
            headers=self._auth(),
            files={"image": ("test.jpg", io.BytesIO(_TINY_JPEG), "image/jpeg")},
            data={
                "waste_type": "bottles",
                "latitude": "-1.9441",
                "longitude": "30.0619",
                "description": "Load test report — safe to delete",
            },
            catch_response=True,
        ) as r:
            if r.status_code == 201:
                r.success()
            elif r.status_code == 400 and "invalid_image" in r.text:
                r.success()  # AI rejection is a valid server response
            else:
                r.failure(f"Unexpected {r.status_code}: {r.text[:200]}")
