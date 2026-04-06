import threading
import time

from flask import Flask, Response, jsonify, send_from_directory

from core.surveillance import SurveillanceSystem


app = Flask(__name__, static_folder="ui", static_url_path="")
system = None
worker = None
system_lock = threading.Lock()
startup_error = None


def _error_status(message):
    return {
        "system_status": "Offline",
        "alarm_status": "Unavailable",
        "active_threat": message,
        "weapon_name": "",
        "weapon_source": "",
        "people": 0,
        "weapons": 0,
        "suspicious": 0,
        "trespass": 0,
        "throwing": False,
        "restricted_zone": {"x1": 0, "y1": 0, "x2": 0, "y2": 0},
        "recent_alerts": [],
        "updated_at": time.strftime("%H:%M:%S"),
    }


def get_system():
    global startup_error
    global system

    with system_lock:
        if system is None:
            try:
                system = SurveillanceSystem()
                startup_error = None
            except Exception as exc:
                startup_error = str(exc)
                raise
        return system


def _run_system_worker(current_system):
    global startup_error

    try:
        current_system.run_forever(show_window=False)
    except Exception as exc:
        startup_error = str(exc)


def ensure_worker():
    global startup_error
    global worker

    if worker is not None and worker.is_alive():
        return

    try:
        current_system = get_system()
    except Exception:
        return

    startup_error = None
    worker = threading.Thread(target=_run_system_worker, args=(current_system,), daemon=True)
    worker.start()
    time.sleep(0.35)


@app.route("/")
def index():
    try:
        ensure_worker()
    except Exception:
        pass
    return send_from_directory(app.static_folder, "showcase.html")


@app.route("/api/status")
def status():
    ensure_worker()
    if startup_error:
        return jsonify(_error_status(startup_error)), 503

    try:
        return jsonify(get_system().get_status())
    except Exception as exc:
        return jsonify(_error_status(str(exc))), 503


@app.route("/video_feed")
def video_feed():
    ensure_worker()

    if startup_error:
        return Response(status=503)

    def generate():
        while True:
            if startup_error:
                break
            frame = get_system().get_jpeg_frame()
            if frame is None:
                time.sleep(0.08)
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
            )
            time.sleep(0.04)

    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")


if __name__ == "__main__":
    ensure_worker()
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
