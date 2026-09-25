"""Verify detection on real sample from Kaggle dataset."""

import os
from pathlib import Path
import sys
import cv2

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.behavior.analyzer import BehaviorResult
from src.detection.detector import ObjectDetector
from src.risk.engine import RiskEngine
from src.utils.visualizer import Visualizer


def test_real_dataset_image():
    detector = ObjectDetector(
        scene_model_path="yolov8n.pt",
        weapon_model_path="models/hf_firearm/weights/best.pt",
        device="cpu",
    )

    test_img_path = r"c:\Users\Sham\Downloads\archive\weapon_detection\train\images\Handgun_10.jpeg"
    if not os.path.exists(test_img_path):
        print(f"Skipping test, image not found at {test_img_path}")
        return

    frame = cv2.imread(test_img_path)
    assert frame is not None, "Failed to load test image"
    print(f"Loaded real dataset image {test_img_path}, shape: {frame.shape}")

    detections = detector.detect(frame)
    print(f"Detections found: {len(detections)}")
    for d in detections:
        print(f" -> Category: {d.category}, Class: {d.class_name}, Conf: {d.confidence:.2f}, Box: {d.bbox}")

    weapons = [d for d in detections if d.category == "WEAPON"]
    normal_objects = [d for d in detections if d.category == "NORMAL_OBJECT"]

    risk_engine = RiskEngine()
    risk = risk_engine.evaluate(weapons=weapons, behavior=BehaviorResult(), normal_objects=normal_objects)
    print(f"Risk Assessment: Score={risk.score}, Level={risk.level}, Threat={risk.primary_threat}")

    visualizer = Visualizer(zone_polygon=[])
    annotated = visualizer.draw(
        frame=frame,
        tracked_people=[],
        weapons=weapons,
        normal_objects=normal_objects,
        behavior=BehaviorResult(),
        risk=risk,
        fps=28.5,
    )

    out_path = "evidence/test_real_detection_output.jpg"
    os.makedirs("evidence", exist_ok=True)
    cv2.imwrite(out_path, annotated)
    print(f"Saved tactical output visual to {out_path}")
    print("TEST REAL DATASET IMAGE PASSED!")


if __name__ == "__main__":
    test_real_dataset_image()
