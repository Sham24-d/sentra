"""Alert Management Module for Rakshak.

Handles non-blocking audio alerts, cooldown timers, and evidence snapshot capture.
"""

from datetime import datetime
import os
from pathlib import Path
import threading
import time
from typing import Optional
import cv2
import numpy as np
from src.database.db import DatabaseManager
from src.risk.engine import RiskAssessment
from src.behavior.analyzer import BehaviorResult


class AlertManager:
    """Coordinates evidence capture, sound triggers, and database logging."""

    def __init__(
        self,
        db: DatabaseManager,
        evidence_dir: str = "evidence",
        sound_file: str = "alarm.mp3",
        sound_enabled: bool = False,
        cooldown_seconds: float = 5.0,
    ):
        self.db = db
        self.evidence_dir = Path(evidence_dir)
        self.evidence_dir.mkdir(parents=True, exist_ok=True)
        self.sound_file = sound_file
        self.sound_enabled = sound_enabled
        self.cooldown_seconds = cooldown_seconds

        self.last_alert_time = 0.0
        self._sound_thread: Optional[threading.Thread] = None
        self._is_playing_audio = False

    def handle_assessment(
        self,
        assessment: RiskAssessment,
        behavior: BehaviorResult,
        frame: np.ndarray,
        weapon_count: int,
    ) -> Optional[str]:
        """Trigger alerts if risk level is actionable and cooldown has elapsed.

        Returns snapshot path if an incident was logged, else None.
        """
        now = time.time()

        # Only trigger actionable alarms for HIGH and CRITICAL risks
        if not assessment.is_actionable:
            return None

        # Check cooldown to prevent alarm fatigue and duplicate evidence writes
        if (now - self.last_alert_time) < self.cooldown_seconds:
            return None

        self.last_alert_time = now

        # 1. Save Evidence Snapshot
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        snapshot_filename = f"incident_{timestamp_str}_{assessment.level}_{assessment.score}.jpg"
        snapshot_path = str(self.evidence_dir / snapshot_filename)

        try:
            cv2.imwrite(snapshot_path, frame)
        except Exception as e:
            print(f"[SENTRA:Alert] Error saving snapshot: {e}")
            snapshot_path = None

        # 2. Log to SQLite Database
        self.db.log_incident(
            risk_score=assessment.score,
            risk_level=assessment.level,
            primary_threat=assessment.primary_threat,
            breakdown=assessment.breakdown,
            events=behavior.events,
            person_count=behavior.crowd_count,
            weapon_count=weapon_count,
            snapshot_path=snapshot_path,
        )

        # 3. Fire Sound in Background Thread
        if self.sound_enabled:
            self._play_alarm_async()

        return snapshot_path

    def _play_alarm_async(self) -> None:
        """Trigger audio alert in a non-blocking background thread."""
        if self._is_playing_audio:
            return

        def _sound_worker():
            self._is_playing_audio = True
            try:
                # 1. Try playsound if alarm file exists
                if os.path.exists(self.sound_file):
                    from playsound import playsound
                    playsound(self.sound_file)
                else:
                    # 2. Windows fallback beep
                    import winsound
                    winsound.Beep(1200, 600)
            except Exception:
                try:
                    import winsound
                    winsound.Beep(1000, 500)
                except Exception:
                    pass
            finally:
                self._is_playing_audio = False

        self._sound_thread = threading.Thread(target=_sound_worker, daemon=True, name="RAKSHAK-SoundThread")
        self._sound_thread.start()
