import time

try:
    import requests # pyright: ignore[reportMissingModuleSource]
except ImportError:
    requests = None

try:
    from playsound import playsound
except ImportError:
    playsound = None


last_alert_time = 0


def play_alarm():
    global last_alert_time

    if time.time() - last_alert_time > 5:
        try:
            if playsound is None:
                raise RuntimeError("playsound is not installed")
            playsound("alarm.mp3")
        except Exception as exc:
            print(f"Alarm playback failed: {exc}")
        last_alert_time = time.time()


def send_mobile_alert():
    url = "https://maker.ifttt.com/trigger/alert/with/key/YOUR_IFTTT_KEY"

    try:
        if requests is None:
            raise RuntimeError("requests is not installed")
        requests.get(url, timeout=5)
    except Exception as exc:
        print(f"Mobile alert failed: {exc}")
