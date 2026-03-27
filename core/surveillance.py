import os
import threading
import time
from collections import deque

from alert.alert import play_alarm, send_mobile_alert
from core.behavior import Behavior
from core.pose import detect_throw
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
WEAPON_CLASS_IDS = {43: "knife", 76: "scissors"}
TRACKED_CLASS_IDS = [PERSON_CLASS_ID, *WEAPON_CLASS_IDS.keys()]
PERSON_CONFIDENCE = 0.45
WEAPON_CONFIDENCE = 0.3
ALERT_COOLDOWN_SECONDS = 5


class SurveillanceSystem:
    def __init__(self, camera_index=0, model_path="yolov8n.pt"):
        if cv2 is None:
            raise ImportError("opencv-python is not installed. Install dependencies first.")
        if YOLO is None:
            raise ImportError("ultralytics is not installed. Install dependencies first.")

        self.camera_index = camera_index
        self.model = YOLO(model_path)
        self.behavior = Behavior()
        self.restricted_zone = (400, 100, 700, 400)
        self.frame_count = 0
        self.last_alert_at = 0.0
        self.latest_frame = None
        self.latest_status = self._empty_status()
        self.recent_alerts = deque(maxlen=6)
        self.lock = threading.Lock()
        self.running = False
        self.capture = None

        os.makedirs("evidence", exist_ok=True)

    def _empty_status(self):
        return {
            "system_status": "Starting",
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

        self.capture.set(3, 960)
        self.capture.set(4, 540)
        self.running = True

    def stop(self):
        self.running = False
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
        if self.frame_count % 2 != 0:
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

        results = self.model.track(
            frame,
            persist=True,
            classes=TRACKED_CLASS_IDS,
            conf=min(PERSON_CONFIDENCE, WEAPON_CONFIDENCE),
            verbose=False,
        )
        throwing = detect_throw(frame)

        rx1, ry1, rx2, ry2 = self.restricted_zone
        cv2.rectangle(frame, (rx1, ry1), (rx2, ry2), (255, 0, 0), 2)

        status = self._empty_status()
        status["system_status"] = "Monitoring"
        status["throwing"] = bool(throwing)

        for result in results:
            boxes = getattr(result, "boxes", None)
            if boxes is None or boxes.id is None:
                continue

            for box, track_id, cls, conf in zip(
                boxes.xyxy,
                boxes.id,
                boxes.cls,
                boxes.conf,
            ):
                x1, y1, x2, y2 = map(int, box)
                track_id = int(track_id)
                cls = int(cls)
                confidence = float(conf)

                if cls == PERSON_CLASS_ID and confidence < PERSON_CONFIDENCE:
                    continue
                if cls in WEAPON_CLASS_IDS and confidence < WEAPON_CONFIDENCE:
                    continue

                cx = (x1 + x2) // 2
                cy = (y1 + y2) // 2

                label = "NORMAL"
                color = (0, 255, 0)
                object_name = "person" if cls == PERSON_CLASS_ID else WEAPON_CLASS_IDS.get(cls, "object")

                if cls == PERSON_CLASS_ID:
                    status["people"] += 1

                    if self.behavior.check_loiter(track_id):
                        label = "SUSPICIOUS"
                        color = (0, 165, 255)
                        status["suspicious"] += 1

                    if rx1 < cx < rx2 and ry1 < cy < ry2:
                        label = "TRESPASS"
                        color = (255, 0, 255)
                        status["trespass"] += 1
                        self._trigger_alert("Restricted area breach detected")

                    if throwing:
                        label = "DANGEROUS"
                        color = (0, 0, 255)
                        self._trigger_alert("Throwing motion detected")
                        show_alert(frame, "THROW DETECTED")

                elif cls in WEAPON_CLASS_IDS:
                    status["weapons"] += 1
                    label = object_name.upper()
                    color = (0, 0, 255)
                    self._trigger_alert(f"{object_name.title()} detected")
                    show_alert(frame, f"{object_name.upper()} DETECTED")
                    self._save_evidence(frame)

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

        status["recent_alerts"] = list(self.recent_alerts)
        status["updated_at"] = time.strftime("%H:%M:%S")
        return frame, status

    def _trigger_alert(self, message):
        now = time.time()
        if now - self.last_alert_at < ALERT_COOLDOWN_SECONDS:
            return

        play_alarm()
        send_mobile_alert()
        self.last_alert_at = now
        self.recent_alerts.appendleft(
            {
                "message": message,
                "time": time.strftime("%H:%M:%S"),
            }
        )

    def _save_evidence(self, frame):
        filename = f"evidence/{int(time.time())}.jpg"
        cv2.imwrite(filename, frame)

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
