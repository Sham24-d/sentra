"""SENTRA Security Operations Dashboard (Streamlit).

Provides real-time situational awareness, incident history,
threat breakdowns, and evidence snapshot inspection.
"""

from pathlib import Path
import time
import pandas as pd
from PIL import Image
import streamlit as st
import yaml

from src.database.db import DatabaseManager

# Page Configuration
st.set_page_config(
    page_title="SENTRA // Security Operations",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom Dark Theme Styling
st.markdown(
    """
    <style>
    .stApp {
        background-color: #0b0f19;
        color: #e2e8f0;
    }
    .metric-card {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
    }
    .metric-value {
        font-size: 2rem;
        font-weight: 700;
        margin-top: 4px;
    }
    .badge-critical {
        color: #ef4444;
        font-weight: 800;
    }
    .badge-high {
        color: #f97316;
        font-weight: 800;
    }
    .badge-medium {
        color: #eab308;
        font-weight: 800;
    }
    .badge-low {
        color: #22c55e;
        font-weight: 800;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_resource
def get_db():
    return DatabaseManager(db_path="sentra.db")


def load_config():
    cfg_path = Path("config/settings.yaml")
    if cfg_path.exists():
        with open(cfg_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}


def main():
    db = get_db()
    config = load_config()

    # Sidebar
    st.sidebar.title("🛡️ SENTRA Ops")
    st.sidebar.caption("Behavioral Risk Intelligence System")
    st.sidebar.markdown("---")

    auto_refresh = st.sidebar.checkbox("Auto-Refresh Telemetry", value=True)
    refresh_rate = st.sidebar.slider("Refresh Rate (seconds)", min_value=1, max_value=10, value=3)

    st.sidebar.markdown("### System Configuration")
    sound_status = "🔊 Enabled" if config.get("alerts", {}).get("sound_enabled", True) else "🔇 Muted"
    st.sidebar.info(f"Audio Alarm: **{sound_status}**")
    st.sidebar.info(f"Loiter Threshold: **{config.get('behavior', {}).get('loiter_time_threshold', 10)}s**")
    st.sidebar.info(f"Crowd Limit: **{config.get('behavior', {}).get('crowd_threshold', 4)} persons**")

    # Main Header
    st.title("🛡️ SENTRA — Risk Intelligence Command Center")
    st.caption("Real-Time Multi-Factor Surveillance & Threat Prioritization | Team NextPhase")

    # Summary Stats
    stats = db.get_summary_stats()
    c1, c2, c3, c4 = st.columns(4)

    with c1:
        st.markdown(
            f"""
            <div class="metric-card">
                <div style="color: #94a3b8; font-size: 0.85rem;">TOTAL INCIDENTS</div>
                <div class="metric-value" style="color: #38bdf8;">{stats.get('total_incidents', 0)}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c2:
        st.markdown(
            f"""
            <div class="metric-card">
                <div style="color: #94a3b8; font-size: 0.85rem;">CRITICAL ALERTS</div>
                <div class="metric-value" style="color: #ef4444;">{stats.get('critical_count', 0)}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c3:
        st.markdown(
            f"""
            <div class="metric-card">
                <div style="color: #94a3b8; font-size: 0.85rem;">HIGH PRIORITY</div>
                <div class="metric-value" style="color: #f97316;">{stats.get('high_count', 0)}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c4:
        st.markdown(
            f"""
            <div class="metric-card">
                <div style="color: #94a3b8; font-size: 0.85rem;">PEAK RISK SCORE</div>
                <div class="metric-value" style="color: #eab308;">{stats.get('max_score', 0)}/100</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("---")

    # Tabs: Incident Feed & Evidence Gallery
    tab_feed, tab_evidence, tab_about = st.tabs(["🚨 Incident Feed", "📸 Evidence Gallery", "ℹ️ Architecture & Methodology"])

    with tab_feed:
        st.subheader("Recent Security Incidents")
        incidents = db.get_recent_incidents(limit=25)

        if not incidents:
            st.info("No actionable incidents logged yet. System is monitoring normal activity.")
        else:
            table_data = []
            for inc in incidents:
                table_data.append(
                    {
                        "ID": inc["id"],
                        "Timestamp": inc["timestamp"],
                        "Risk Level": inc["risk_level"],
                        "Score": f"{inc['risk_score']}/100",
                        "Primary Threat": inc["primary_threat"],
                        "Persons": inc["person_count"],
                        "Weapons": inc["weapon_count"],
                        "Evidence": "📸 Available" if inc["snapshot_path"] else "None",
                    }
                )

            df = pd.DataFrame(table_data)
            st.dataframe(df, use_container_width=True, hide_index=True)

    with tab_evidence:
        st.subheader("Forensic Evidence Inspection")
        incidents = db.get_recent_incidents(limit=20)
        evidence_incidents = [i for i in incidents if i.get("snapshot_path") and Path(i["snapshot_path"]).exists()]

        if not evidence_incidents:
            st.info("No evidence snapshots captured yet.")
        else:
            selected_idx = st.selectbox(
                "Select Incident for Detailed Review:",
                range(len(evidence_incidents)),
                format_func=lambda i: f"#{evidence_incidents[i]['id']} - {evidence_incidents[i]['timestamp']} - {evidence_incidents[i]['primary_threat']} (Score: {evidence_incidents[i]['risk_score']})",
            )

            sel = evidence_incidents[selected_idx]
            col_img, col_meta = st.columns([2, 1])

            with col_img:
                img_path = sel["snapshot_path"]
                try:
                    img = Image.open(img_path)
                    st.image(img, caption=f"Evidence Snapshot: {sel['primary_threat']}", use_container_width=True)
                except Exception as e:
                    st.error(f"Could not load image: {e}")

            with col_meta:
                st.markdown("#### Incident Diagnostics")
                st.write(f"**Incident ID:** #{sel['id']}")
                st.write(f"**Recorded At:** {sel['timestamp']}")
                st.write(f"**Risk Priority:** {sel['risk_level']} ({sel['risk_score']}/100)")
                st.write(f"**Threat Factor:** {sel['primary_threat']}")

                st.markdown("##### Score Attribution Breakdown")
                if sel.get("breakdown"):
                    for factor, pts in sel["breakdown"].items():
                        st.write(f"- {factor}: **+{pts} pts**")
                else:
                    st.write("Standard baseline")

                st.markdown("##### Detected Events")
                if sel.get("events"):
                    for ev in sel["events"]:
                        st.caption(f"• {ev}")

    with tab_about:
        st.subheader("Rakshak Behavioral Risk Intelligence Architecture")
        st.markdown(
            """
            **Rakshak** delivers transparent risk prioritization over traditional passive CCTV.
            
            - **Perception Pipeline:** Pretrained YOLOv8n isolates human bodies while explicitly differentiating **Safe Everyday Objects** (cell phones, backpacks, bottles) from **Weapons** (firearms, edged weapons).
            - **Multi-Person Tracking:** ByteTrack maintains persistent track IDs, motion trajectories, and velocity calculations.
            - **Behavioral Analysis:** Point-in-polygon geometry identifies **Restricted Zone Intrusion**, temporal timers flag **Suspicious Loitering**, density counters flag **Crowd Surges**, and kinematic speed monitors **Rapid Running**.
            - **Transparent Risk Scoring:** Mathematical weighted scoring formula bounded between 0 and 100 with clear explainability.
            """
        )

    # Auto-refresh loop
    if auto_refresh:
        time.sleep(refresh_rate)
        st.rerun()


if __name__ == "__main__":
    main()
