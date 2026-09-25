"""Multi-Person Tracking Module for Rakshak using ByteTrack.

Maintains persistent identity (track_id) for each person across frames,
records trajectory history, and computes motion velocity.
"""

from collections import deque
from dataclasses import dataclass, field
import time
from typing import Dict, List, Optional, Tuple
import numpy as np
from ultralytics import YOLO


@dataclass
class TrackedPerson:
    """Represents a tracked person across time."""
    track_id: int
    bbox: Tuple[int, int, int, int]  # (x1, y1, x2, y2)
    confidence: float
    first_seen: float
    last_seen: float
    history: deque = field(default_factory=lambda: deque(maxlen=30))
    speed_px_per_sec: float = 0.0
    zone_entry_time: Optional[float] = None
    in_zone: bool = False

    @property
    def center(self) -> Tuple[int, int]:
        x1, y1, x2, y2 = self.bbox
        return (int((x1 + x2) / 2), int((y1 + y2) / 2))

    @property
    def bottom_center(self) -> Tuple[int, int]:
        """Ground contact point (feet) for accurate zone testing."""
        x1, y1, x2, y2 = self.bbox
        return (int((x1 + x2) / 2), int(y2))

    @property
    def zone_dwell_duration(self) -> float:
        """Returns time in seconds spent inside restricted zone."""
        if self.in_zone and self.zone_entry_time is not None:
            return max(0.0, time.time() - self.zone_entry_time)
        return 0.0


class PersonTracker:
    """Wraps ByteTrack tracking for robust multi-person trajectory analysis."""

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        tracker_config: str = "bytetrack.yaml",
        track_buffer: int = 30,
        match_thresh: float = 0.7,
        device: str = "cpu",
        person_conf: float = 0.35,
    ):
        self.device = device
        self.person_conf = person_conf
        self.tracker_config = tracker_config
        self.model = YOLO(model_path)
        self.tracks: Dict[int, TrackedPerson] = {}
        self.last_update_time = time.time()

    def update(self, frame: np.ndarray) -> List[TrackedPerson]:
        """Run ByteTrack on the frame for class 0 (person) and update tracks."""
        now = time.time()
        dt = max(0.001, now - self.last_update_time)
        self.last_update_time = now

        # Ultralytics track call with persist=True maintains ByteTrack state
        results = self.model.track(
            frame,
            classes=[0],  # only person
            conf=self.person_conf,
            tracker=self.tracker_config,
            persist=True,
            device=self.device,
            verbose=False,
        )

        current_tracked_people: List[TrackedPerson] = []
        active_ids = set()

        if results and len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            if boxes.id is not None:
                for i in range(len(boxes)):
                    track_id = int(boxes.id[i].item())
                    conf = float(boxes.conf[i].item())
                    xyxy = boxes.xyxy[i].cpu().numpy().astype(int)
                    bbox = (int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3]))
                    center = (int((bbox[0] + bbox[2]) / 2), int((bbox[1] + bbox[3]) / 2))

                    active_ids.add(track_id)

                    if track_id not in self.tracks:
                        # New track initialized
                        tracked = TrackedPerson(
                            track_id=track_id,
                            bbox=bbox,
                            confidence=conf,
                            first_seen=now,
                            last_seen=now,
                        )
                        tracked.history.append((center, now))
                        self.tracks[track_id] = tracked
                    else:
                        tracked = self.tracks[track_id]
                        prev_center = tracked.center
                        tracked.bbox = bbox
                        tracked.confidence = conf
                        tracked.last_seen = now
                        tracked.history.append((center, now))

                        # Calculate instantaneous speed (pixels per second)
                        dist = np.sqrt((center[0] - prev_center[0]) ** 2 + (center[1] - prev_center[1]) ** 2)
                        instant_speed = dist / dt
                        # Exponential moving average to smooth noisy detections
                        tracked.speed_px_per_sec = 0.7 * tracked.speed_px_per_sec + 0.3 * instant_speed

                    current_tracked_people.append(self.tracks[track_id])

        # Purge stale tracks not seen for > 3.0 seconds
        stale_ids = [tid for tid, t in self.tracks.items() if now - t.last_seen > 3.0]
        for tid in stale_ids:
            del self.tracks[tid]

        return current_tracked_people
