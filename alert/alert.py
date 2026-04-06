import threading
import time

try:
    import winsound
except ImportError:
    winsound = None


_alarm_thread = None
_alarm_stop_event = threading.Event()
_alarm_lock = threading.Lock()


def _alarm_loop():
    while not _alarm_stop_event.is_set():
        if winsound is not None:
            try:
                winsound.Beep(1800, 350)
                if _alarm_stop_event.is_set():
                    break
                winsound.Beep(1400, 250)
            except RuntimeError:
                time.sleep(0.2)
        else:
            time.sleep(0.5)

        time.sleep(0.1)


def start_alarm():
    global _alarm_thread

    with _alarm_lock:
        if _alarm_thread is not None and _alarm_thread.is_alive():
            return

        _alarm_stop_event.clear()
        _alarm_thread = threading.Thread(target=_alarm_loop, daemon=True)
        _alarm_thread.start()


def stop_alarm():
    global _alarm_thread

    with _alarm_lock:
        thread = _alarm_thread
        _alarm_stop_event.set()
        _alarm_thread = None

    if thread is not None and thread.is_alive():
        thread.join(timeout=0.6)


def is_alarm_active():
    return _alarm_thread is not None and _alarm_thread.is_alive()
