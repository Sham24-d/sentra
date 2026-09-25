# Rakshak – Behavioral Risk Intelligence System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![YOLOv8](https://img.shields.io/badge/Model-YOLOv8-green.svg)](https://github.com/ultralytics/ultralytics)
[![Tracking](https://img.shields.io/badge/Tracking-ByteTrack-orange.svg)]()
[![Dashboard](https://img.shields.io/badge/UI-Streamlit-red.svg)](https://streamlit.io/)

Developed by Team **NextPhase**.

---

## 1. Overview

**Rakshak** is an AI-powered intelligent video surveillance system that converts standard CCTV or webcam video streams into **real-time, prioritized risk intelligence**.

Instead of passive video recording that requires constant human monitoring, Rakshak continuously processes live video to detect:
- **People & Multiple Targets** with persistent identity tracking.
- **Weapon Detection** (Firearms & Edged Weapons) vs. **Normal Everyday Objects** (Cell Phones, Bags, Bottles).
- **Behavioral Patterns**:
  - Restricted Area Intrusion (Point-in-Polygon).
  - Suspicious Loitering (Track dwell timer).
  - Abnormal Speed / Running (Centroid velocity).
  - Crowd Surges (Occupancy density threshold).
- **Explainable Multi-Factor Risk Scoring**: Deterministic 0–100 score mapped to `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL` alert tiers.
- **Automated Alerts & Persistence**: Audio alarms, forensic snapshot saving, and SQLite logging.
- **Operator Command Center**: Interactive Streamlit dashboard.

---

## 2. System Architecture

```
Camera / Video Stream (src/camera/stream.py)
         │  (Threaded capture eliminating buffer lag)
         ▼
Object Detection (src/detection/detector.py)
         │  ├── Person (YOLOv8n)
         │  ├── Weapon (Firearm / Edged Weapons) ──► THREAT [RED]
         │  └── Normal Objects (Phones, Bottles, Bags) ──► SAFE [GREEN]
         ▼
Multi-Person Tracking (src/tracking/tracker.py)
         │  (ByteTrack assigns persistent IDs & trajectory history)
         ▼
Behavior Analysis (src/behavior/analyzer.py)
         │  ├── Restricted Zone Intrusion (Point-in-Polygon)
         │  ├── Loitering Detection (Track dwell timer > threshold)
         │  ├── Crowd Density (Active person count > threshold)
         │  └── Rapid Movement (Centroid velocity Δd/Δt)
         ▼
Risk Intelligence Engine (src/risk/engine.py)
         │  (Explainable 0–100 mathematical risk score)
         ▼
Alert & Persistence (src/alerts/ + src/database/)
         │  ├── Evidence Snapshot capture
         │  └── SQLite Database logging (sentra.db)
         ▼
Operations & Display
         ├── Tactical HUD (OpenCV live surveillance window)
         ├── Enterprise React SOC Console (frontend/ on port 8000)
         └── Streamlit Operations Dashboard (dashboard/app.py)
```

---

## 3. Directory Layout

```
SENTRA/
├── config/
│   └── settings.yaml           # Central system parameters & thresholds
├── dashboard/
│   └── app.py                  # Streamlit operations command center
├── evidence/                   # Incident snapshots & forensic images
├── models/
│   └── hf_firearm/             # Specialized firearm detector weights
├── src/
│   ├── alerts/                 # Audio alerts & snapshot manager
│   ├── behavior/               # Spatial-temporal behavior heuristics
│   ├── camera/                 # Threaded video capture
│   ├── database/               # SQLite persistence manager
│   ├── detection/              # Unified YOLO detector (Person, Weapon, Safe Items)
│   ├── pipeline.py             # Master system orchestrator
│   ├── risk/                   # 0-100 risk scoring engine
│   ├── tracking/               # ByteTrack multi-person tracker
│   └── utils/                  # Tactical HUD overlay renderer
├── tests/                      # Unit & integration test suite
├── main.py                     # Unified CLI entry point
├── requirements.txt
└── README.md
```

---

## 4. How to Run

### Activate Python Environment
```bash
.\.venv\Scripts\activate
```

### 1. Launch Live Surveillance Monitor (Tactical HUD)
```bash
python main.py
```
- Press **'q'** or **ESC** to stop.

### 2. Run with a Custom Video File
```bash
python main.py --source path/to/cctv_footage.mp4
```

### 3. Launch Streamlit Operations Center
```bash
python main.py --dashboard
# OR
streamlit run dashboard/app.py
```
Opens in your browser at `http://localhost:8501`.

### 4. Launch React Web Console and FastAPI Backend

Install the backend dependencies once:

```powershell
python -m pip install -r requirements.txt
```

Use two terminals from the project root. In the first terminal, start the API:

```powershell
.\.venv\Scripts\Activate.ps1
python main.py --web
```

In the second terminal, start the React development server from the `frontend` directory:

```powershell
cd frontend
npm install
npm run dev
```

Open the React console at `http://localhost:3000`. Its `/api` requests are proxied to the FastAPI backend at `http://localhost:8000`.

For a single-server production-style run, build the frontend first, then start FastAPI:

```powershell
cd frontend
npm run build
cd ..
python main.py --web
```

Open `http://localhost:8000`.

### 5. Run Test Suite
```bash
python -m unittest tests/test_pipeline.py
python tests/test_single_frame.py
python tests/test_real_data.py
```

---

## 5. Risk Scoring Logic

Risk scores are **100% auditable and explainable**:

$$\text{Score} = \min\left(100, \sum (w_i \times \text{event}_i) + \text{synergy}\right)$$

| Event | Weight | Rationale |
| :--- | :---: | :--- |
| **Firearm Detected** | **+60** | Extreme threat factor |
| **Edged Weapon Detected** | **+45** | High threat factor |
| **Restricted Area Intrusion**| **+30** | Unauthorized boundary crossing |
| **Armed Intrusion Synergy** | **+25** | Bonus if an armed person crosses into a restricted zone |
| **Suspicious Loitering** | **+15** | Dwell duration exceeds threshold |
| **Abnormal Movement (Running)** | **+15** | Rapid kinematic velocity indicating panic or flight |
| **Crowd Limit Exceeded** | **+10** | High density surge |
| **Normal Objects (Phone, Bag)**| **+0** | **Actively categorized as SAFE to suppress false alarms** |

### Priority Tiers
- `LOW` (0–29): Normal routine activity.
- `MEDIUM` (30–59): Monitored event (e.g. single intrusion or loitering).
- `HIGH` (60–79): Urgent priority (e.g. visible firearm or multiple breaches).
- `CRITICAL` (80–100): Emergency intervention required (e.g. armed zone intruder).
