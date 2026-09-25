"""Test suite for FastAPI backend endpoints."""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import unittest
from fastapi.testclient import TestClient
from api_server import app


class TestApiServer(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_stats_endpoint(self):
        res = self.client.get("/api/stats")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("activeCameras", data)
        self.assertIn("peopleDetected", data)

    def test_cameras_endpoint(self):
        res = self.client.get("/api/cameras")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data), 0)
        self.assertEqual(data[0]["code"], "CAM-01")

    def test_risk_endpoint(self):
        res = self.client.get("/api/risk")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("currentScore", data)
        self.assertIn("priorityLevel", data)

    def test_incidents_endpoint(self):
        res = self.client.get("/api/incidents")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)


if __name__ == "__main__":
    unittest.main()
