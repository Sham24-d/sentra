from pathlib import Path

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None


BASE_DIR = Path(__file__).resolve().parent.parent
POSE_MODEL_PATH = BASE_DIR / "core" / "yolov8n-pose.pt"
LEFT_SHOULDER = 5
RIGHT_SHOULDER = 6
LEFT_ELBOW = 7
RIGHT_ELBOW = 8
LEFT_WRIST = 9
RIGHT_WRIST = 10
MIN_KEYPOINT_CONFIDENCE = 0.45
WRIST_RAISE_DELTA = 35
ELBOW_RAISE_DELTA = 16
ARM_EXTENSION_DELTA = 28


def _load_pose_model():
    if YOLO is None or not POSE_MODEL_PATH.exists():
        return None
    return YOLO(str(POSE_MODEL_PATH))


_pose_model = _load_pose_model()


def _valid_point(point, confidence):
    return confidence >= MIN_KEYPOINT_CONFIDENCE


def _arm_looks_like_throw(shoulder, elbow, wrist, shoulder_conf, elbow_conf, wrist_conf):
    if not (
        _valid_point(shoulder, shoulder_conf)
        and _valid_point(elbow, elbow_conf)
        and _valid_point(wrist, wrist_conf)
    ):
        return False

    wrist_above_shoulder = (shoulder[1] - wrist[1]) > WRIST_RAISE_DELTA
    elbow_above_shoulder = (shoulder[1] - elbow[1]) > ELBOW_RAISE_DELTA
    arm_extended = abs(wrist[0] - shoulder[0]) > ARM_EXTENSION_DELTA
    return wrist_above_shoulder and elbow_above_shoulder and arm_extended


def detect_throw(frame):
    if _pose_model is None or frame is None:
        return False

    results = _pose_model.predict(frame, conf=0.35, imgsz=320, verbose=False)
    for result in results:
        keypoints = getattr(result, "keypoints", None)
        if keypoints is None or keypoints.xy is None or keypoints.conf is None:
            continue

        xy_points = keypoints.xy.cpu().tolist()
        conf_points = keypoints.conf.cpu().tolist()

        for points, confidences in zip(xy_points, conf_points):
            if _arm_looks_like_throw(
                points[LEFT_SHOULDER],
                points[LEFT_ELBOW],
                points[LEFT_WRIST],
                confidences[LEFT_SHOULDER],
                confidences[LEFT_ELBOW],
                confidences[LEFT_WRIST],
            ):
                return True

            if _arm_looks_like_throw(
                points[RIGHT_SHOULDER],
                points[RIGHT_ELBOW],
                points[RIGHT_WRIST],
                confidences[RIGHT_SHOULDER],
                confidences[RIGHT_ELBOW],
                confidences[RIGHT_WRIST],
            ):
                return True

    return False
