try:
    import mediapipe as mp
except ImportError:
    mp = None


def _build_pose():
    if mp is None:
        return None, None

    pose_module = getattr(getattr(mp, "solutions", None), "pose", None)
    if pose_module is None:
        return None, None

    pose_instance = pose_module.Pose(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    return pose_instance, pose_module


_pose, _pose_module = _build_pose()


def detect_throw(frame):
    if _pose is None or _pose_module is None or frame is None:
        return False

    rgb_frame = frame[:, :, ::-1]
    results = _pose.process(rgb_frame)
    if not results.pose_landmarks:
        return False

    landmarks = results.pose_landmarks.landmark
    left_shoulder = landmarks[_pose_module.PoseLandmark.LEFT_SHOULDER]
    right_shoulder = landmarks[_pose_module.PoseLandmark.RIGHT_SHOULDER]
    left_wrist = landmarks[_pose_module.PoseLandmark.LEFT_WRIST]
    right_wrist = landmarks[_pose_module.PoseLandmark.RIGHT_WRIST]

    return (
        left_wrist.y < left_shoulder.y - 0.08
        or right_wrist.y < right_shoulder.y - 0.08
    )
