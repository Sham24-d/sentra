import os
import threading
import time
from collections import deque

from alert.alert import is_alarm_active, start_alarm, stop_alarm
from core.behavior import Behavior
from core.pose import detect_throw
from core.settings import load_settings
from ui.ui import draw_ui, show_alert

try:
    import cv2
except ImportError:
    cv2 = None

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None


PERSON_CLASS_ID = 0
FALLBACK_WEAPON_CLASS_IDS = {43: "knife", 76: "scissors"}
IGNORED_WEAPON_LABELS = {"person", "people", "human"}
DISPLAY_WEAPON_LABELS = {"gun": "weapon"}


class SurveillanceSystem:
    def __init__(self, camera_index=None, model_path=None):
        if cv2 is None:
            raise ImportError("opencv-python is not installed. Install dependencies first.")
        if YOLO is None:
            raise ImportError("ultralytics is not installed. Install dependencies first.")

        self.settings = load_settings()
        self.camera_index = self.settings.camera_index if camera_index is None else camera_index
        scene_model_path = self.settings.resolved_scene_model_path() if model_path is None else model_path
        self.scene_model = YOLO(str(scene_model_path))
        self.weapon_model = self._load_weapon_model()
        self.weapon_model_names = self._extract_weapon_names()
        self.behavior = Behavior()
        self.restricted_zone = tuple(self.settings.restricted_zone)
        self.frame_count = 0
        self.latest_frame = None
        self.cached_weapon_detections = []
        self.cached_throwing = False
        self.recent_alerts = deque(maxlen=6)
        self.lock = threading.Lock()
        self.running = False
        self.capture = None
        self.event_streaks = {name: 0 for name in self.settings.event_settings}
        self.active_events = set()
        self.latest_status = self._empty_status()

        os.makedirs("evidence", exist_ok=True)

    def _load_weapon_model(self):
        if not self.settings.use_hf_weapon_model:
            return None

        weapon_path = self.settings.resolved_weapon_model_path()
        if not weapon_path.exists():
            return None

        return YOLO(str(weapon_path))

    def _extract_weapon_names(self):
        if self.weapon_model is None:
            return {}
        names = getattr(self.weapon_model, "names", {})
        if isinstance(names, dict):
            return {int(key): str(value) for key, value in names.items()}
        return {index: str(value) for index, value in enumerate(names)}

    def _display_weapon_label(self, label):
        return DISPLAY_WEAPON_LABELS.get(label.strip().lower(), label)

    def _empty_status(self):
        return {
            "system_status": "Starting",
            "alarm_status": "Armed",
            "active_threat": "No confirmed danger",
            "weapon_name": "",
            "weapon_source": "huggingface model" if self.weapon_model is not None else "fallback coco classes",
            "people": 0,
            "weapons": 0,
            "suspicious": 0,
            "trespass": 0,
            "throwing": False,
            "restricted_zone": {
                "x1": self.restricted_zone[0],
                "y1": self.restricted_zone[1],
                "x2": self.restricted_zone[2],
                "y2": self.restricted_zone[3],
            },
            "recent_alerts": [],
            "updated_at": time.strftime("%H:%M:%S"),
        }

    def start(self):
        if self.running:
            return

        self.capture = cv2.VideoCapture(self.camera_index)
        if not self.capture.isOpened():
            raise RuntimeError("Unable to access the camera.")

        self.capture.set(3, self.settings.capture_width)
        self.capture.set(4, self.settings.capture_height)
        try:
            self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        except Exception:
            pass
        self.running = True

    def stop(self):
        self.running = False
        stop_alarm()
        if self.capture is not None:
            self.capture.release()
            self.capture = None

    def run_forever(self, show_window=False):
        self.start()

        try:
            while self.running:
                processed = self.process_next_frame(show_window=show_window)
                if not processed:
                    break
        finally:
            self.stop()
            if show_window and cv2 is not None:
                cv2.destroyAllWindows()

    def process_next_frame(self, show_window=False):
        if self.capture is None:
            raise RuntimeError("Camera is not initialized.")

        ret, frame = self.capture.read()
        if not ret:
            return False

        self.frame_count += 1
        if self.frame_count % self.settings.frame_stride != 0:
            return True

        processed_frame, status = self._analyze_frame(frame)

        with self.lock:
            self.latest_frame = processed_frame
            self.latest_status = status

        if show_window:
            cv2.imshow("Sentra", processed_frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                self.running = False
                return False

        return True

    def _analyze_frame(self, frame):
        draw_ui(frame)
        original_frame = frame.copy()

        person_results = self.scene_model.track(
            frame,
            persist=True,
            classes=[PERSON_CLASS_ID],
            conf=self.settings.person_confidence,
            imgsz=self.settings.scene_imgsz,
            verbose=False,
        )
        person_detections = self._extract_person_detections(person_results)
        weapon_detections = self._detect_weapons(frame)
        throwing = self._detect_throw_cached(frame, bool(person_detections))

        rx1, ry1, rx2, ry2 = self.restricted_zone
        cv2.rectangle(frame, (rx1, ry1), (rx2, ry2), (255, 0, 0), 2)

        status = self._empty_status()
        status["system_status"] = "Monitoring"
        status["throwing"] = bool(throwing)

        seen_events = {name: False for name in self.settings.event_settings}
        message_by_event = {}
        event_payloads = {}

        for person_record in person_detections:
            x1, y1, x2, y2 = person_record["xyxy"]
            track_id = person_record["track_id"]
            confidence = person_record["confidence"]
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2
            label = "NORMAL"
            color = (0, 255, 0)
            status["people"] += 1

            if self.behavior.check_loiter(track_id):
                label = "SUSPICIOUS"
                color = (0, 165, 255)
                status["suspicious"] += 1
                seen_events["abnormal"] = True
                message_by_event["abnormal"] = "Abnormal activity detected"
                event_payloads["abnormal"] = {"person": person_record, "reason": "loitering"}

            if rx1 < cx < rx2 and ry1 < cy < ry2:
                label = "TRESPASS"
                color = (255, 0, 255)
                status["trespass"] += 1
                seen_events["trespass"] = True
                message_by_event["trespass"] = "Restricted area breach detected"

            if throwing:
                label = "DANGEROUS"
                color = (0, 0, 255)
                seen_events["throw"] = True
                message_by_event["throw"] = "Throwing motion detected"
                event_payloads["throw"] = {"person": person_record, "reason": "throwing"}

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(
                frame,
                f"ID {track_id} {label} {confidence:.2f}",
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color,
                2,
            )

        for detection in weapon_detections:
            x1, y1, x2, y2 = detection["xyxy"]
            label = detection["label"]
            display_label = self._display_weapon_label(label)
            confidence = detection["confidence"]
            status["weapons"] += 1
            status["weapon_name"] = display_label
            seen_events["weapon"] = True
            message_by_event["weapon"] = f"{display_label.title()} detected"
            event_payloads["weapon"] = {"weapon": detection, "person": self._find_associated_person(detection, person_detections)}

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.putText(
                frame,
                f"{display_label.upper()} {confidence:.2f}",
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                2,
            )

        confirmed_messages = []
        for event_name, event_seen in seen_events.items():
            message = message_by_event.get(event_name)
            if not message:
                self._update_event_state(event_name, False)
                continue

            if self._update_event_state(event_name, event_seen):
                self._dispatch_event(event_name, message, frame, original_frame, event_payloads.get(event_name))
                confirmed_messages.append(message.upper())

        self._sync_alarm_state()

        if confirmed_messages:
            show_alert(frame, confirmed_messages[0])
            status["alarm_status"] = "Alarm active" if is_alarm_active() else "Visual alert"
            status["active_threat"] = confirmed_messages[0]
        elif self.active_events:
            if "weapon" in self.active_events and status["weapon_name"]:
                status["active_threat"] = f"{status['weapon_name'].upper()} DETECTED"
            else:
                active_name = next(iter(self.active_events))
                status["active_threat"] = self.settings.event_settings[active_name].overlay
            status["alarm_status"] = "Alarm active" if is_alarm_active() else "Visual alert"
        else:
            status["alarm_status"] = "Armed"

        status["recent_alerts"] = list(self.recent_alerts)
        status["updated_at"] = time.strftime("%H:%M:%S")
        return frame, status

    def _detect_weapons(self, frame):
        if self.frame_count % self.settings.weapon_inference_interval != 0:
            return list(self.cached_weapon_detections)

        detections = []
        if self.weapon_model is not None:
            detections.extend(self._detect_weapons_with_hf_model(frame))
        detections.extend(self._detect_weapons_with_fallback(frame))
        self.cached_weapon_detections = self._deduplicate_weapon_detections(detections)
        return list(self.cached_weapon_detections)

    def _extract_person_detections(self, person_results):
        person_detections = []
        for result in person_results:
            boxes = getattr(result, "boxes", None)
            if boxes is None or boxes.id is None:
                continue

            for box, track_id, conf in zip(boxes.xyxy, boxes.id, boxes.conf):
                x1, y1, x2, y2 = map(int, box)
                confidence = float(conf)
                if confidence < self.settings.person_confidence:
                    continue
                person_detections.append(
                    {
                        "track_id": int(track_id),
                        "xyxy": (x1, y1, x2, y2),
                        "confidence": confidence,
                    }
                )
        return person_detections

    def _detect_throw_cached(self, frame, has_people):
        if not has_people:
            self.cached_throwing = False
            return False

        if self.frame_count % self.settings.pose_inference_interval != 0:
            return self.cached_throwing

        self.cached_throwing = detect_throw(frame)
        return self.cached_throwing

    def _detect_weapons_with_hf_model(self, frame):
        results = self.weapon_model.predict(
            frame,
            conf=self.settings.hf_weapon_confidence,
            imgsz=self.settings.weapon_imgsz,
            verbose=False,
        )
        detections = []
        for result in results:
            boxes = getattr(result, "boxes", None)
            if boxes is None:
                continue

            for box, cls, conf in zip(boxes.xyxy, boxes.cls, boxes.conf):
                x1, y1, x2, y2 = map(int, box)
                class_id = int(cls)
                label = self.weapon_model_names.get(class_id, "weapon")
                if label.strip().lower() in IGNORED_WEAPON_LABELS:
                    continue
                detections.append(
                    {
                        "xyxy": (x1, y1, x2, y2),
                        "label": label,
                        "confidence": float(conf),
                    }
                )
        return detections

    def _detect_weapons_with_fallback(self, frame):
        results = self.scene_model.predict(
            frame,
            classes=list(FALLBACK_WEAPON_CLASS_IDS.keys()),
            conf=self.settings.fallback_weapon_confidence,
            imgsz=self.settings.weapon_imgsz,
            verbose=False,
        )
        detections = []
        for result in results:
            boxes = getattr(result, "boxes", None)
            if boxes is None:
                continue

            for box, cls, conf in zip(boxes.xyxy, boxes.cls, boxes.conf):
                x1, y1, x2, y2 = map(int, box)
                class_id = int(cls)
                detections.append(
                    {
                        "xyxy": (x1, y1, x2, y2),
                        "label": FALLBACK_WEAPON_CLASS_IDS.get(class_id, "weapon"),
                        "confidence": float(conf),
                    }
                )
        return detections

    def _deduplicate_weapon_detections(self, detections):
        unique = []
        for detection in sorted(detections, key=lambda item: item["confidence"], reverse=True):
            if any(self._same_detection(detection, existing) for existing in unique):
                continue
            unique.append(detection)
        return unique

    def _same_detection(self, left, right):
        if left["label"].strip().lower() != right["label"].strip().lower():
            return False
        return self._iou(left["xyxy"], right["xyxy"]) >= 0.4

    def _iou(self, box_a, box_b):
        ax1, ay1, ax2, ay2 = box_a
        bx1, by1, bx2, by2 = box_b

        inter_x1 = max(ax1, bx1)
        inter_y1 = max(ay1, by1)
        inter_x2 = min(ax2, bx2)
        inter_y2 = min(ay2, by2)

        inter_w = max(0, inter_x2 - inter_x1)
        inter_h = max(0, inter_y2 - inter_y1)
        inter_area = inter_w * inter_h
        if inter_area == 0:
            return 0.0

        area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
        area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
        union_area = area_a + area_b - inter_area
        if union_area <= 0:
            return 0.0
        return inter_area / union_area

    def _find_associated_person(self, weapon_detection, person_detections):
        if not person_detections:
            return None

        wx1, wy1, wx2, wy2 = weapon_detection["xyxy"]
        weapon_center = ((wx1 + wx2) / 2, (wy1 + wy2) / 2)
        best_person = None
        best_distance = float("inf")

        for person in person_detections:
            px1, py1, px2, py2 = person["xyxy"]
            if px1 <= weapon_center[0] <= px2 and py1 <= weapon_center[1] <= py2:
                return person
            person_center = ((px1 + px2) / 2, (py1 + py2) / 2)
            distance = ((weapon_center[0] - person_center[0]) ** 2 + (weapon_center[1] - person_center[1]) ** 2) ** 0.5
            if distance < best_distance:
                best_distance = distance
                best_person = person

        if best_person is None:
            return None

        px1, py1, px2, py2 = best_person["xyxy"]
        person_width = max(px2 - px1, 1)
        person_height = max(py2 - py1, 1)
        max_distance = max(person_width, person_height) * 0.9
        return best_person if best_distance <= max_distance else None

    def _update_event_state(self, event_name, seen_this_frame):
        if not seen_this_frame:
            self.event_streaks[event_name] = 0
            self.active_events.discard(event_name)
            return False

        self.event_streaks[event_name] += 1
        if self.event_streaks[event_name] < self.settings.event_settings[event_name].confirm_frames:
            return False

        if event_name in self.active_events:
            return False

        self.active_events.add(event_name)
        return True

    def _dispatch_event(self, event_name, message, frame, original_frame, payload=None):
        event_setting = self.settings.event_settings[event_name]
        self.recent_alerts.appendleft(
            {
                "message": message,
                "time": time.strftime("%H:%M:%S"),
            }
        )

        if event_setting.snapshot:
            self._save_evidence(frame, event_name, payload)
            if event_name == "weapon":
                self._save_person_with_weapon(original_frame, payload)

    def _sync_alarm_state(self):
        alarm_required = any(
            self.settings.event_settings[event_name].alarm
            for event_name in self.active_events
        )

        if alarm_required:
            start_alarm()
        else:
            stop_alarm()

    def _save_evidence(self, frame, event_name, payload=None):
        suffix = event_name
        if payload and payload.get("weapon"):
            suffix = payload["weapon"]["label"].replace(" ", "_").lower()
        filename = f"evidence/{int(time.time())}_{suffix}.jpg"
        cv2.imwrite(filename, frame)

    def _save_person_with_weapon(self, frame, payload):
        if not payload:
            return

        person = payload.get("person")
        weapon = payload.get("weapon")
        if person is None or weapon is None:
            return

        x1, y1, x2, y2 = person["xyxy"]
        padding = 30
        fx1 = max(0, x1 - padding)
        fy1 = max(0, y1 - padding)
        fx2 = min(frame.shape[1], x2 + padding)
        fy2 = min(frame.shape[0], y2 + padding)
        crop = frame[fy1:fy2, fx1:fx2]
        if crop.size == 0:
            return

        weapon_name = weapon["label"].replace(" ", "_").lower()
        filename = f"evidence/{int(time.time())}_person_with_{weapon_name}.jpg"
        cv2.imwrite(filename, crop)

    def get_status(self):
        with self.lock:
            return dict(self.latest_status)

    def get_jpeg_frame(self):
        with self.lock:
            frame = None if self.latest_frame is None else self.latest_frame.copy()

        if frame is None:
            return None

        ok, buffer = cv2.imencode(".jpg", frame)
        if not ok:
            return None
        return buffer.tobytes()
