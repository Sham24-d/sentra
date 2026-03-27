try:
    import cv2
except ImportError:
    cv2 = None


def draw_ui(frame):
    if frame is None or cv2 is None:
        return

    cv2.putText(
        frame,
        "Sentra",
        (15, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (255, 255, 255),
        2,
    )


def show_alert(frame, message):
    if frame is None or cv2 is None:
        return

    cv2.rectangle(frame, (10, 45), (360, 90), (0, 0, 255), -1)
    cv2.putText(
        frame,
        message,
        (20, 75),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2,
    )
