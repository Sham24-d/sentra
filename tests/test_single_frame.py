"""Direct frame test for RakshakEngine components."""

import sys
from pathlib import Path
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.behavior.analyzer import BehaviorAnalyzer
from src.database.db import DatabaseManager
from src.detection.detector import ObjectDetector
from src.risk.engine import RiskEngine
from src.tracking.tracker import PersonTracker
from src.utils.visualizer import Visualizer


def test_components_direct():
    print("[1/6] Testing ObjectDetector...")
    detector = ObjectDetector(
        scene_model_path="yolov8n.pt",
        weapon_model_path="models/hf_firearm/weights/best.pt",
        device="cpu",
    )
    # Test on a blank 640x480 frame
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    detections = detector.detect(frame)
    print(f" -> Detections on blank frame: {len(detections)}")

    print("[2/6] Testing PersonTracker...")
    tracker = PersonTracker(model_path="yolov8n.pt", device="cpu")
    tracked = tracker.update(frame)
    print(f" -> Tracked persons: {len(tracked)}")

    print("[3/6] Testing BehaviorAnalyzer...")
    analyzer = BehaviorAnalyzer(restricted_zone=[[100, 100], [500, 100], [500, 400], [100, 400]])
    behavior = analyzer.analyze(tracked)
    print(f" -> Behavior result crowd count: {behavior.crowd_count}")

    print("[4/6] Testing RiskEngine...")
    risk_engine = RiskEngine()
    risk = risk_engine.evaluate(weapons=[], behavior=behavior)
    print(f" -> Risk score: {risk.score}, Level: {risk.level}")

    print("[5/6] Testing Visualizer...")
    visualizer = Visualizer(zone_polygon=analyzer.zone_polygon)
    annotated = visualizer.draw(
        frame=frame,
        tracked_people=tracked,
        weapons=[],
        normal_objects=[],
        behavior=behavior,
        risk=risk,
        fps=30.0,
    )
    print(f" -> Annotated frame shape: {annotated.shape}")

    print("[6/6] Testing DatabaseManager...")
    db = DatabaseManager("sentra.db")
    stats = db.get_summary_stats()
    print(f" -> DB Stats: {stats}")

    print("ALL COMPONENT PIPELINE TESTS PASSED!")


if __name__ == "__main__":
    test_components_direct()
