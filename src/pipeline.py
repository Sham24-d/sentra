"""SENTRA Pipeline Orchestrator.

Integrates Camera Ingestion, Detection, Tracking, Behavior Analysis,
Risk Scoring, Alerts, and SQLite Persistence into a unified pipeline.
"""

from pathlib import Path
import time
from typing import Any, Dict, Optional, Tuple
import cv2
import numpy as np
import yaml

from src.alerts.alert_manager import AlertManager
from src.behavior.analyzer import BehaviorAnalyzer, BehaviorResult
from src.camera.stream import CameraStream
from src.database.db import DatabaseManager
from src.detection.detector import ObjectDetector
from src.risk.engine import RiskAssessment, RiskEngine
from src.tracking.tracker import PersonTracker
from src.utils.visualizer import Visualizer


class SentraEngine:
    """Master engine orchestrating the complete SENTRA pipeline."""

    def __init__(self, config_path: str = "config/settings.yaml", source_override: Optional[Any] = None):
        self.config_path = config_path
        self.config = self._load_config(config_path)

        # Allow CLI override for camera / video source
        if source_override is not None:
            self.config["camera"]["source"] = source_override

        cam_cfg = self.config.get("camera", {})
        model_cfg = self.config.get("models", {})
        track_cfg = self.config.get("tracking", {})
        behav_cfg = self.config.get("behavior", {})
        risk_cfg = self.config.get("risk", {})
        alert_cfg = self.config.get("alerts", {})
        db_cfg = self.config.get("database", {})

        # 1. Database
        self.db = DatabaseManager(db_path=db_cfg.get("db_path", "sentra.db"))

        # 2. Camera Stream
        self.stream = CameraStream(
            source=cam_cfg.get("source", 0),
            width=cam_cfg.get("width", 1280),
            height=cam_cfg.get("height", 720),
            loop_video=True,
        )

        # 3. Object Detector (Person, Weapon, Normal Object)
        self.detector = ObjectDetector(
            scene_model_path=model_cfg.get("person_model_path", "yolov8n.pt"),
            weapon_model_path=model_cfg.get("weapon_model_path", "models/hf_firearm/weights/best.pt"),
            device=model_cfg.get("device", "cpu"),
            person_conf=model_cfg.get("person_confidence", 0.40),
            weapon_conf=model_cfg.get("weapon_confidence", 0.35),
            normal_obj_conf=model_cfg.get("normal_obj_confidence", 0.35),
        )

        # 4. Multi-Person Tracker
        self.tracker = PersonTracker(
            model_path=model_cfg.get("person_model_path", "yolov8n.pt"),
            tracker_config=track_cfg.get("tracker_type", "bytetrack.yaml"),
            track_buffer=track_cfg.get("track_buffer", 30),
            match_thresh=track_cfg.get("match_thresh", 0.7),
            device=model_cfg.get("device", "cpu"),
            person_conf=model_cfg.get("person_confidence", 0.35),
        )

        # 5. Behavior Analyzer
        self.restricted_zone = behav_cfg.get("restricted_zone", [[100, 150], [550, 150], [550, 600], [100, 600]])
        self.behavior_analyzer = BehaviorAnalyzer(
            restricted_zone=self.restricted_zone,
            loiter_time_threshold=behav_cfg.get("loiter_time_threshold", 10.0),
            crowd_threshold=behav_cfg.get("crowd_threshold", 4),
            speed_threshold=behav_cfg.get("speed_threshold", 140.0),
        )

        # 6. Risk Engine
        self.risk_engine = RiskEngine(
            weights=risk_cfg.get("weights"),
            synergies=risk_cfg.get("synergies"),
            thresholds=risk_cfg.get("thresholds"),
        )

        # 7. Alert Manager
        self.alert_manager = AlertManager(
            db=self.db,
            evidence_dir=alert_cfg.get("evidence_dir", "evidence"),
            sound_file=alert_cfg.get("sound_file", "alarm.mp3"),
            sound_enabled=alert_cfg.get("sound_enabled", True),
            cooldown_seconds=alert_cfg.get("cooldown_seconds", 5.0),
        )

        # 8. Visualizer
        self.visualizer = Visualizer(zone_polygon=np.array(self.restricted_zone, dtype=np.int32))

        # Runtime state
        self.frame_stride = cam_cfg.get("frame_skip", 1)
        self.frame_idx = 0
        self.latest_assessment: Optional[RiskAssessment] = None
        self.latest_behavior: Optional[BehaviorResult] = None
        self.last_telemetry_time = time.time()

    @staticmethod
    def _load_config(path: str) -> Dict[str, Any]:
        cfg_file = Path(path)
        if not cfg_file.exists():
            return {}
        with open(cfg_file, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def start(self) -> None:
        """Start background camera thread."""
        self.stream.start()

    def stop(self) -> None:
        """Stop camera stream and release resources."""
        self.stream.stop()

    def switch_source(self, new_source: Any) -> bool:
        """Dynamically switch video input source (e.g. external USB cam, RTSP URL, or video file)."""
        if isinstance(new_source, str) and new_source.isdigit():
            new_source = int(new_source)
        try:
            self.stream.stop()
            self.stream = CameraStream(
                source=new_source,
                width=self.config.get("camera", {}).get("width", 1280),
                height=self.config.get("camera", {}).get("height", 720),
                loop_video=True,
            )
            self.stream.start()
            print(f"[SENTRA] Switched video source to: {new_source}")
            return True
        except Exception as e:
            print(f"[SENTRA] Failed to switch video source to {new_source}: {e}")
            return False

    def process_frame(self) -> Tuple[bool, Optional[np.ndarray], Optional[RiskAssessment]]:
        """Run single pipeline cycle."""
        ret, frame = self.stream.read()
        if not ret or frame is None:
            return False, None, None

        self.frame_idx += 1
        fps = self.stream.get_fps()

        # 1. Detection (Person, Weapons, Normal Objects)
        detections = self.detector.detect(frame)
        weapons = [d for d in detections if d.category == "WEAPON"]
        normal_objects = [d for d in detections if d.category == "NORMAL_OBJECT"]

        # 2. Tracking (ByteTrack)
        tracked_people = self.tracker.update(frame)

        # 3. Behavior Analysis
        behavior = self.behavior_analyzer.analyze(tracked_people)
        self.latest_behavior = behavior

        # 4. Risk Assessment
        risk = self.risk_engine.evaluate(
            weapons=weapons,
            behavior=behavior,
            normal_objects=normal_objects,
        )
        self.latest_assessment = risk

        # 5. Alert Handling & Evidence Logging
        self.alert_manager.handle_assessment(
            assessment=risk,
            behavior=behavior,
            frame=frame,
            weapon_count=len(weapons),
        )

        # 6. Periodic Telemetry Logging (every 2 seconds)
        now = time.time()
        if now - self.last_telemetry_time >= 2.0:
            self.db.log_telemetry(fps=fps, risk_score=risk.score, people_count=behavior.crowd_count)
            self.last_telemetry_time = now

        # 7. Render Tactical HUD
        annotated_frame = self.visualizer.draw(
            frame=frame,
            tracked_people=tracked_people,
            weapons=weapons,
            normal_objects=normal_objects,
            behavior=behavior,
            risk=risk,
            fps=fps,
        )

        return True, annotated_frame, risk

    def run_window(self) -> None:
        """Run standard OpenCV Tactical Display loop."""
        print("[RAKSHAK] Starting Tactical Security Monitor. Press 'q' or 'ESC' to exit.")
        self.start()

        win_name = "RAKSHAK // Behavioral Risk Intelligence System"
        cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)

        try:
            while True:
                success, frame, _ = self.process_frame()
                if not success or frame is None:
                    time.sleep(0.01)
                    continue

                cv2.imshow(win_name, frame)
                key = cv2.waitKey(1) & 0xFF
                if key in (ord("q"), 27):  # 'q' or ESC
                    break
        finally:
            self.stop()
            cv2.destroyAllWindows()
            print("[SENTRA] System stopped gracefully.")


# Backwards compatibility alias for older imports.
RakshakEngine = SentraEngine
