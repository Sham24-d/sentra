"""Unit and Integration Tests for Rakshak Modules."""

import os
from pathlib import Path
import tempfile
import time
import unittest
import numpy as np

from src.behavior.analyzer import BehaviorAnalyzer
from src.database.db import DatabaseManager
from src.detection.detector import Detection, ObjectDetector
from src.risk.engine import RiskEngine
from src.tracking.tracker import TrackedPerson


class TestRakshakRiskEngine(unittest.TestCase):
    def setUp(self):
        self.engine = RiskEngine()

    def test_baseline_low_risk(self):
        from src.behavior.analyzer import BehaviorResult
        behavior = BehaviorResult()
        assessment = self.engine.evaluate(weapons=[], behavior=behavior, normal_objects=[])
        self.assertEqual(assessment.score, 0)
        self.assertEqual(assessment.level, "LOW")

    def test_firearm_triggers_high_risk(self):
        from src.behavior.analyzer import BehaviorResult
        weapon = Detection(
            bbox=(100, 100, 200, 200),
            confidence=0.85,
            class_id=0,
            class_name="gun",
            category="WEAPON",
        )
        behavior = BehaviorResult()
        assessment = self.engine.evaluate(weapons=[weapon], behavior=behavior)
        self.assertEqual(assessment.score, 60)
        self.assertEqual(assessment.level, "HIGH")

    def test_armed_intruder_synergy_critical(self):
        from src.behavior.analyzer import BehaviorResult
        weapon = Detection(
            bbox=(100, 100, 200, 200),
            confidence=0.90,
            class_id=0,
            class_name="rifle",
            category="WEAPON",
        )
        behavior = BehaviorResult(intruding_ids=[1])
        assessment = self.engine.evaluate(weapons=[weapon], behavior=behavior)
        # 60 (firearm) + 30 (intrusion) + 25 (synergy) = 115 -> capped at 100
        self.assertEqual(assessment.score, 100)
        self.assertEqual(assessment.level, "CRITICAL")
        self.assertIn("Armed Intrusion Synergy", assessment.breakdown)


class TestRakshakBehavior(unittest.TestCase):
    def setUp(self):
        # 100x100 to 400x400 restricted zone
        zone = [[100, 100], [400, 100], [400, 400], [100, 400]]
        self.analyzer = BehaviorAnalyzer(
            restricted_zone=zone,
            loiter_time_threshold=5.0,
            crowd_threshold=3,
            speed_threshold=100.0,
        )

    def test_intrusion_detection(self):
        now = time.time()
        # Person feet at (250, 250) -> inside zone
        person = TrackedPerson(
            track_id=1,
            bbox=(200, 150, 300, 250),
            confidence=0.8,
            first_seen=now,
            last_seen=now,
        )
        result = self.analyzer.analyze([person])
        self.assertIn(1, result.intruding_ids)
        self.assertTrue(person.in_zone)

    def test_outside_zone_no_intrusion(self):
        now = time.time()
        # Person feet at (50, 50) -> outside zone
        person = TrackedPerson(
            track_id=2,
            bbox=(20, 20, 80, 50),
            confidence=0.8,
            first_seen=now,
            last_seen=now,
        )
        result = self.analyzer.analyze([person])
        self.assertEqual(len(result.intruding_ids), 0)
        self.assertFalse(person.in_zone)

    def test_loitering_trigger(self):
        now = time.time()
        person = TrackedPerson(
            track_id=3,
            bbox=(200, 150, 300, 250),
            confidence=0.8,
            first_seen=now - 10.0,
            last_seen=now,
            zone_entry_time=now - 6.0,  # inside for 6s (> 5.0 threshold)
            in_zone=True,
        )
        result = self.analyzer.analyze([person])
        self.assertIn(3, result.loitering_ids)

    def test_crowd_threshold(self):
        now = time.time()
        people = [
            TrackedPerson(track_id=i, bbox=(10 * i, 10, 20 * i, 50), confidence=0.8, first_seen=now, last_seen=now)
            for i in range(1, 5)  # 4 people >= 3 threshold
        ]
        result = self.analyzer.analyze(people)
        self.assertTrue(result.crowd_exceeded)
        self.assertEqual(result.crowd_count, 4)


class TestSentraDatabase(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "test_sentra.db")
        self.db = DatabaseManager(self.db_path)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_log_and_query_incident(self):
        incident_id = self.db.log_incident(
            risk_score=75,
            risk_level="HIGH",
            primary_threat="WEAPON: FIREARM",
            breakdown={"Weapon": 60, "Running": 15},
            events=["FIREARM DETECTED", "RUNNING"],
            person_count=1,
            weapon_count=1,
            snapshot_path="evidence/test.jpg",
        )
        self.assertGreater(incident_id, 0)

        incidents = self.db.get_recent_incidents(limit=5)
        self.assertEqual(len(incidents), 1)
        self.assertEqual(incidents[0]["risk_score"], 75)
        self.assertEqual(incidents[0]["risk_level"], "HIGH")

        stats = self.db.get_summary_stats()
        self.assertEqual(stats["total_incidents"], 1)
        self.assertEqual(stats["high_count"], 1)
        self.assertEqual(stats["max_score"], 75)


if __name__ == "__main__":
    unittest.main()
