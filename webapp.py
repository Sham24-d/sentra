import threading
import time

from flask import Flask, Response, jsonify, send_from_directory

from core.surveillance import SurveillanceSystem


app = Flask(__name__, static_folder="ui", static_url_path="")
system = SurveillanceSystem()
worker = None


def ensure_worker():
    global worker

    if worker is not None and worker.is_alive():
        return

    worker = threading.Thread(target=system.run_forever, kwargs={"show_window": False}, daemon=True)
    worker.start()
    time.sleep(1.0)


@app.route("/")
def index():
    ensure_worker()
    return send_from_directory(app.static_folder, "showcase.html")


@app.route("/api/status")
def status():
    ensure_worker()
    return jsonify(system.get_status())


@app.route("/video_feed")
def video_feed():
    ensure_worker()

    def generate():
        while True:
            frame = system.get_jpeg_frame()
            if frame is None:
                time.sleep(0.1)
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
            )
            time.sleep(0.03)

    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")


if __name__ == "__main__":
    ensure_worker()
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
