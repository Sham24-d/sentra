"""End-to-end synthetic integration test for Rakshak Engine."""

import os
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import cv2
import numpy as np
import yaml

from src.pipeline import SentraEngine


def test_engine_synthetic_frames():
    print("[TEST] Creating synthetic test video...")
    test_video_path = "tests/test_feed.mp4"
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(test_video_path, fourcc, 20.0, (640, 480))

    # Generate 40 frames of synthetic movement
    for i in range(40):
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        # Draw a moving white rectangle simulating a target
        x = int(50 + i * 8)
        y = int(100 + i * 3)
        cv2.rectangle(frame, (x, y), (x + 80, y + 160), (255, 255, 255), -1)
        out.write(frame)
    out.release()

    print("[TEST] Initializing SentraEngine with synthetic video...")
    engine = SentraEngine(config_path="config/settings.yaml", source_override=test_video_path)
    engine.start()

    processed_count = 0
    try:
        for _ in range(25):
            success, frame, risk = engine.process_frame()
            if success and frame is not None:
                processed_count += 1
                assert frame.shape[0] > 0
                assert frame.shape[1] > 0
                assert risk is not None
                assert 0 <= risk.score <= 100
    finally:
        engine.stop()
        if os.path.exists(test_video_path):
            try:
                os.remove(test_video_path)
            except Exception:
                pass

    print(f"[TEST] Successfully processed {processed_count} frames end-to-end with full HUD and telemetry!")
    assert processed_count >= 15


if __name__ == "__main__":
    test_engine_synthetic_frames()
