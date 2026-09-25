"""Tactical HUD and Visualization Module for Rakshak.

Renders modern surveillance overlays, color-coded detections, trajectory trails,
restricted zones, and real-time risk telemetry on OpenCV frames.
"""

from typing import List, Tuple
import cv2
import numpy as np
from src.behavior.analyzer import BehaviorResult
from src.detection.detector import Detection
from src.risk.engine import RiskAssessment
from src.tracking.tracker import TrackedPerson


class Visualizer:
    """Renders professional surveillance telemetry onto video frames."""

    COLOR_CYAN = (230, 180, 50)      # Person
    COLOR_RED = (40, 40, 240)        # Weapon / Threat
    COLOR_GREEN = (60, 200, 60)      # Safe / Normal Object
    COLOR_YELLOW = (40, 215, 255)    # Warning / Loitering
    COLOR_ORANGE = (0, 140, 255)     # High Alert
    COLOR_WHITE = (245, 245, 245)
    COLOR_DARK = (20, 20, 20)

    def __init__(self, zone_polygon: np.ndarray):
        self.zone_polygon = zone_polygon

    def set_zone(self, points: np.ndarray) -> None:
        self.zone_polygon = points

    def draw(
        self,
        frame: np.ndarray,
        tracked_people: List[TrackedPerson],
        weapons: List[Detection],
        normal_objects: List[Detection],
        behavior: BehaviorResult,
        risk: RiskAssessment,
        fps: float = 0.0,
    ) -> np.ndarray:
        """Render complete tactical HUD onto a copy of the frame."""
        canvas = frame.copy()
        h, w = canvas.shape[:2]

        # 1. Draw Restricted Zone
        self._draw_restricted_zone(canvas, behavior)

        # 2. Draw Trajectory Trails for Tracked Persons
        self._draw_trajectories(canvas, tracked_people)

        # 3. Draw Normal Objects (Green / Safe)
        for obj in normal_objects:
            self._draw_box(
                canvas,
                obj.bbox,
                label=f"SAFE: {obj.class_name.upper()} {obj.confidence:.2f}",
                color=self.COLOR_GREEN,
                fill_tag=False,
            )

        # 4. Draw Tracked People (Cyan / Highlighted if Breaching)
        for person in tracked_people:
            is_intruder = person.track_id in behavior.intruding_ids
            is_loiterer = person.track_id in behavior.loitering_ids
            is_runner = person.track_id in behavior.running_ids

            box_color = self.COLOR_CYAN
            status_tags = []

            if is_intruder:
                box_color = self.COLOR_RED
                status_tags.append("INTRUDER")
            if is_loiterer:
                box_color = self.COLOR_YELLOW
                status_tags.append(f"LOITER {person.zone_dwell_duration:.0f}s")
            if is_runner:
                status_tags.append(f"RUN {person.speed_px_per_sec:.0f}px/s")

            tag_str = " | ".join(status_tags)
            label = f"ID #{person.track_id}" + (f" [{tag_str}]" if tag_str else "")
            self._draw_box(canvas, person.bbox, label=label, color=box_color, fill_tag=True)

        # 5. Draw Weapons (Neon Red / Flashing Threat)
        for weapon in weapons:
            self._draw_box(
                canvas,
                weapon.bbox,
                label=f"THREAT: {weapon.class_name.upper()} {weapon.confidence:.2f}",
                color=self.COLOR_RED,
                fill_tag=True,
                thickness=3,
            )

        # 6. Draw Top Tactical HUD Bar
        self._draw_top_bar(canvas, risk, behavior, fps, w)

        # 7. Draw Bottom-Left Risk Telemetry Gauge
        self._draw_risk_gauge(canvas, risk, h)

        return canvas

    def _draw_restricted_zone(self, canvas: np.ndarray, behavior: BehaviorResult) -> None:
        """Render the restricted area boundary and translucent fill."""
        if len(self.zone_polygon) < 3:
            return

        is_breached = bool(behavior.intruding_ids)
        zone_color = self.COLOR_RED if is_breached else self.COLOR_GREEN

        # Translucent overlay
        overlay = canvas.copy()
        cv2.fillPoly(overlay, [self.zone_polygon], zone_color)
        alpha = 0.20 if is_breached else 0.10
        cv2.addWeighted(overlay, alpha, canvas, 1 - alpha, 0, canvas)

        # Outer border
        cv2.polylines(canvas, [self.zone_polygon], isClosed=True, color=zone_color, thickness=2, lineType=cv2.LINE_AA)

        # Zone Label
        label_pos = (int(self.zone_polygon[0][0]), int(max(25, self.zone_polygon[0][1] - 8)))
        zone_status = "[BREACH DETECTED]" if is_breached else "[SECURE]"
        cv2.putText(
            canvas,
            f"RESTRICTED ZONE {zone_status}",
            label_pos,
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            zone_color,
            2,
            cv2.LINE_AA,
        )

    def _draw_trajectories(self, canvas: np.ndarray, tracked_people: List[TrackedPerson]) -> None:
        """Draw motion path lines for each tracked person."""
        for p in tracked_people:
            if len(p.history) >= 2:
                points = [pt for pt, _ in p.history]
                for i in range(1, len(points)):
                    thickness = max(1, int(3 * (i / len(points))))
                    cv2.line(canvas, points[i - 1], points[i], self.COLOR_CYAN, thickness, cv2.LINE_AA)

    def _draw_box(
        self,
        canvas: np.ndarray,
        bbox: Tuple[int, int, int, int],
        label: str,
        color: Tuple[int, int, int],
        fill_tag: bool = True,
        thickness: int = 2,
    ) -> None:
        """Draw aesthetic bounded box with corner accents and label tag."""
        x1, y1, x2, y2 = bbox

        # Main rectangle
        cv2.rectangle(canvas, (x1, y1), (x2, y2), color, thickness)

        # Label tag background
        font_scale = 0.48
        (tw, th), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, 1)
        tag_y1 = max(0, y1 - th - 8)
        tag_y2 = y1

        if fill_tag:
            cv2.rectangle(canvas, (x1, tag_y1), (x1 + tw + 10, tag_y2), color, -1)
            cv2.putText(
                canvas,
                label,
                (x1 + 5, y1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                (10, 10, 10),
                1,
                cv2.LINE_AA,
            )
        else:
            # Translucent dark tag for safe items
            sub = canvas[tag_y1:tag_y2, x1 : x1 + tw + 10]
            if sub.shape[0] > 0 and sub.shape[1] > 0:
                dark_rect = np.zeros_like(sub)
                cv2.addWeighted(dark_rect, 0.7, sub, 0.3, 0, sub)
                canvas[tag_y1:tag_y2, x1 : x1 + tw + 10] = sub

            cv2.putText(
                canvas,
                label,
                (x1 + 5, y1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                color,
                1,
                cv2.LINE_AA,
            )

    def _draw_top_bar(
        self,
        canvas: np.ndarray,
        risk: RiskAssessment,
        behavior: BehaviorResult,
        fps: float,
        w: int,
    ) -> None:
        """Top HUD banner showing system name, FPS, telemetry, and priority badge."""
        bar_h = 44
        # Semi-transparent dark header
        header_overlay = canvas[:bar_h, :].copy()
        dark_bar = np.zeros_like(header_overlay)
        cv2.addWeighted(dark_bar, 0.85, header_overlay, 0.15, 0, header_overlay)
        canvas[:bar_h, :] = header_overlay

        # System Brand
        cv2.putText(
            canvas,
            "RAKSHAK // RISK INTELLIGENCE",
            (14, 28),
            cv2.FONT_HERSHEY_DUPLEX,
            0.65,
            self.COLOR_WHITE,
            1,
            cv2.LINE_AA,
        )

        # FPS & Occupancy
        meta_text = f"FPS: {fps:.1f}  |  TRACKED: {behavior.crowd_count}"
        cv2.putText(
            canvas,
            meta_text,
            (400, 27),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.50,
            (180, 180, 180),
            1,
            cv2.LINE_AA,
        )

        # Alert Level Badge on the right
        badge_text = f"ALERT: {risk.level} ({risk.score}/100)"
        (bw, bh), _ = cv2.getTextSize(badge_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        badge_x = w - bw - 24
        cv2.rectangle(canvas, (badge_x - 8, 6), (badge_x + bw + 8, 36), risk.color_bgr, -1)
        cv2.putText(
            canvas,
            badge_text,
            (badge_x, 26),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (10, 10, 10) if risk.level != "CRITICAL" else self.COLOR_WHITE,
            2,
            cv2.LINE_AA,
        )

    def _draw_risk_gauge(self, canvas: np.ndarray, risk: RiskAssessment, h: int) -> None:
        """Bottom-left tactical telemetry box."""
        box_w = 320
        box_h = 75
        box_x = 15
        box_y = h - box_h - 15

        # Background card
        sub = canvas[box_y : box_y + box_h, box_x : box_x + box_w]
        if sub.shape[0] == box_h and sub.shape[1] == box_w:
            card = np.zeros_like(sub)
            cv2.addWeighted(card, 0.85, sub, 0.15, 0, sub)
            canvas[box_y : box_y + box_h, box_x : box_x + box_w] = sub
            cv2.rectangle(canvas, (box_x, box_y), (box_x + box_w, box_y + box_h), (60, 60, 60), 1)

        # Primary Threat text
        cv2.putText(
            canvas,
            risk.primary_threat[:35],
            (box_x + 10, box_y + 22),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            risk.color_bgr,
            1,
            cv2.LINE_AA,
        )

        # Progress bar background
        bar_x = box_x + 10
        bar_y = box_y + 35
        bar_w = box_w - 20
        bar_h = 10
        cv2.rectangle(canvas, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), (50, 50, 50), -1)

        # Filled progress
        fill_w = int(bar_w * (risk.score / 100.0))
        if fill_w > 0:
            cv2.rectangle(canvas, (bar_x, bar_y), (bar_x + fill_w, bar_y + bar_h), risk.color_bgr, -1)

        # Breakdown summary
        breakdown_str = " + ".join([f"{k[:12]}:{v}" for k, v in list(risk.breakdown.items())[:2]])
        if not breakdown_str:
            breakdown_str = "No active risk factors"
        cv2.putText(
            canvas,
            breakdown_str,
            (box_x + 10, box_y + 63),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.38,
            (170, 170, 170),
            1,
            cv2.LINE_AA,
        )
