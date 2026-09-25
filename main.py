"""SENTRA - Behavioral Risk Intelligence System.

Main Application Entry Point.
Run standard surveillance window:
    python main.py
Run with custom video file:
    python main.py --source path/to/cctv.mp4
Launch Streamlit Command Center:
    python main.py --dashboard
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.pipeline import RakshakEngine


def parse_args():
    parser = argparse.ArgumentParser(description="SENTRA - Behavioral Risk Intelligence System")
    parser.add_argument(
        "--source",
        default=None,
        help="Camera index (e.g. 0) or path to video file (e.g. video.mp4)",
    )
    parser.add_argument(
        "--config",
        default="config/settings.yaml",
        help="Path to YAML configuration file",
    )
    parser.add_argument(
        "--web",
        action="store_true",
        help="Launch the Enterprise React SOC Web Dashboard & API server",
    )
    parser.add_argument(
        "--dashboard",
        action="store_true",
        help="Launch the Streamlit Operations Dashboard",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run pipeline in headless mode without OpenCV display window",
    )
    return parser.parse_args()


def launch_web_console():
    """Launch Enterprise React SOC Web Dashboard & FastAPI server."""
    import webbrowser
    import uvicorn
    print("[SENTRA] Launching Enterprise SOC Console at http://localhost:8000 ...")
    webbrowser.open("http://localhost:8000")
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=False)


def launch_dashboard():
    """Launch Streamlit dashboard application."""
    app_path = str(PROJECT_ROOT / "dashboard" / "app.py")
    python_exe = sys.executable
    cmd = [python_exe, "-m", "streamlit", "run", app_path, "--server.headless=false"]
    print(f"[SENTRA] Launching Streamlit Command Center at {app_path}...")
    subprocess.run(cmd)


def main():
    args = parse_args()

    if args.source is not None:
        os.environ["SENTRA_SOURCE"] = str(args.source)

    if args.web:
        launch_web_console()
        return

    if args.dashboard:
        launch_dashboard()
        return

    # Initialize and run SENTRA Pipeline
    source = args.source
    if source is not None and source.isdigit():
        source = int(source)

    engine = SentraEngine(config_path=args.config, source_override=source)

    if args.headless:
        print("[SENTRA] Running in headless mode. Press Ctrl+C to stop.")
        engine.start()
        try:
            while True:
                engine.process_frame()
        except KeyboardInterrupt:
            engine.stop()
            print("[SENTRA] Headless run terminated.")
    else:
        engine.run_window()


if __name__ == "__main__":
    main()
