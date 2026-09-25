"""Behavioral Analysis Module for Rakshak.

Implements rule-based spatial and temporal heuristics:
1. Restricted Area Intrusion (Point-in-Polygon check on person footpoint).
2. Loitering Detection (Tracking dwell duration inside the zone).
3. Crowd Density (Counting active tracked persons against a threshold).
4. Running Detection (Kinematic speed threshold in pixels/second).
"""

from dataclasses import dataclass, field
import time
from typing import List, Tuple, Union
import cv2
import numpy as np
from src.tracking.tracker import TrackedPerson


@dataclass
class BehaviorResult:
    """Summary of all behavioral events detected in the current frame."""
    intruding_ids: List[int] = field(default_factory=list)
    loitering_ids: List[int] = field(default_factory=list)
    running_ids: List[int] = field(default_factory=list)
    crowd_count: int = 0
    crowd_exceeded: bool = False
    events: List[str] = field(default_factory=list)

    @property
    def has_any_event(self) -> bool:
        return bool(self.intruding_ids or self.loitering_ids or self.running_ids or self.crowd_exceeded)


class BehaviorAnalyzer:
    """Evaluates spatial-temporal behaviors on tracked persons."""

    def __init__(
        self,
        restricted_zone: List[Union[List[int], Tuple[int, int]]],
        loiter_time_threshold: float = 10.0,
        crowd_threshold: int = 4,
        speed_threshold: float = 140.0,
    ):
        self.zone_polygon = np.array(restricted_zone, dtype=np.int32)
        self.loiter_time_threshold = loiter_time_threshold
        self.crowd_threshold = crowd_threshold
        self.speed_threshold = speed_threshold

    def set_zone(self, points: List[Union[List[int], Tuple[int, int]]]) -> None:
        """Dynamically update restricted zone polygon."""
        self.zone_polygon = np.array(points, dtype=np.int32)

    def analyze(self, tracked_people: List[TrackedPerson]) -> BehaviorResult:
        """Analyze current frame tracks against behavioral rules."""
        now = time.time()
        result = BehaviorResult()
        result.crowd_count = len(tracked_people)

        # 1. Crowd Density check
        if result.crowd_count >= self.crowd_threshold:
            result.crowd_exceeded = True
            result.events.append(f"CROWD_DENSITY ({result.crowd_count} people >= {self.crowd_threshold})")

        # 2. Per-person checks: Intrusion, Loitering, Running
        for person in tracked_people:
            footpoint = person.bottom_center

            # Point-in-polygon test: >= 0 means inside or on edge
            inside = False
            if len(self.zone_polygon) >= 3:
                inside = cv2.pointPolygonTest(self.zone_polygon, (float(footpoint[0]), float(footpoint[1])), False) >= 0

            if inside:
                person.in_zone = True
                if person.zone_entry_time is None:
                    person.zone_entry_time = now

                result.intruding_ids.append(person.track_id)
                dwell = now - person.zone_entry_time

                # Loitering Check
                if dwell >= self.loiter_time_threshold:
                    result.loitering_ids.append(person.track_id)
                    result.events.append(f"LOITERING (ID #{person.track_id} in zone for {dwell:.1f}s)")
                else:
                    result.events.append(f"INTRUSION (ID #{person.track_id} in restricted zone)")
            else:
                # Outside zone: reset dwell timer
                person.in_zone = False
                person.zone_entry_time = None

            # Running Check
            if person.speed_px_per_sec >= self.speed_threshold:
                result.running_ids.append(person.track_id)
                result.events.append(f"ABNORMAL_MOVEMENT (ID #{person.track_id} running at {person.speed_px_per_sec:.0f}px/s)")

        return result
