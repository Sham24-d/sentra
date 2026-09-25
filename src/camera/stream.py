"""Camera and Video Ingestion Module for Rakshak.

Uses a background thread to continually grab the latest frame,
eliminating OpenCV internal buffer lag and ensuring real-time FPS.
"""

import threading
import time
from typing import Optional, Tuple, Union
import cv2
import numpy as np


class CameraStream:
    """Threaded Video Stream Reader."""

    def __init__(
        self,
        source: Union[int, str] = 0,
        width: int = 1280,
        height: int = 720,
        loop_video: bool = True,
    ):
        self.source = source
        self.width = width
        self.height = height
        self.loop_video = loop_video

        self.cap: Optional[cv2.VideoCapture] = None
        self.frame: Optional[np.ndarray] = None
        self.ret: bool = False
        self.running: bool = False
        self.lock = threading.Lock()
        self.thread: Optional[threading.Thread] = None

        # FPS calculation
        self._prev_time = time.time()
        self._fps = 0.0
        self._frame_count = 0

    def start(self) -> "CameraStream":
        """Initialize capture and start background reader thread."""
        if self.running:
            return self

        # Initialize VideoCapture
        if isinstance(self.source, str) and self.source.isdigit():
            self.cap = cv2.VideoCapture(int(self.source))
        else:
            self.cap = cv2.VideoCapture(self.source)

        if not self.cap.isOpened():
            raise RuntimeError(f"[RAKSHAK:Camera] Failed to open video source: {self.source}")

        # Try setting resolution
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        try:
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        except Exception:
            pass

        # Read the first frame synchronously
        ret, frame = self.cap.read()
        if not ret or frame is None:
            raise RuntimeError(f"[RAKSHAK:Camera] Could not read initial frame from source: {self.source}")

        self.frame = frame
        self.ret = ret
        self.running = True

        self.thread = threading.Thread(target=self._capture_loop, daemon=True, name="RAKSHAK-CameraThread")
        self.thread.start()
        return self

    def _capture_loop(self) -> None:
        """Continuously update the latest frame in the background."""
        while self.running and self.cap is not None:
            ret, frame = self.cap.read()

            if not ret or frame is None:
                # If reading from video file and loop enabled, rewind
                if self.loop_video and isinstance(self.source, str):
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    time.sleep(0.01)
                    continue
                else:
                    with self.lock:
                        self.ret = False
                    time.sleep(0.05)
                    continue

            # Update FPS tracking
            now = time.time()
            dt = now - self._prev_time
            if dt > 0.5:
                self._fps = self._frame_count / dt
                self._frame_count = 0
                self._prev_time = now
            self._frame_count += 1

            # Thread-safe write of latest frame
            with self.lock:
                self.ret = ret
                self.frame = frame

            # Micro-sleep to prevent 100% CPU thread starvation
            time.sleep(0.005)

    def read(self) -> Tuple[bool, Optional[np.ndarray]]:
        """Return the most recently captured frame."""
        with self.lock:
            if self.frame is None:
                return False, None
            return self.ret, self.frame.copy()

    def get_fps(self) -> float:
        """Get the current measured input stream FPS."""
        return self._fps

    def stop(self) -> None:
        """Stop background capture and release resources."""
        self.running = False
        if self.thread is not None and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        if self.cap is not None:
            self.cap.release()
            self.cap = None

    def __enter__(self) -> "CameraStream":
        return self.start()

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.stop()
