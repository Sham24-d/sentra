"""SQLite Persistence Module for Rakshak.

Manages auditable incident logging, evidence references, and telemetry history.
"""

from contextlib import contextmanager
from datetime import datetime
import json
from pathlib import Path
import sqlite3
import threading
from typing import Any, Dict, List, Optional


class DatabaseManager:
    """Thread-safe SQLite manager for SENTRA."""

    def __init__(self, db_path: str = "sentra.db"):
        self.db_path = str(Path(db_path).resolve())
        self.lock = threading.Lock()
        self._init_tables()

    @contextmanager
    def _connection(self):
        """Context manager guaranteeing connection closure on Windows."""
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def _init_tables(self) -> None:
        """Create schema if it does not exist."""
        with self.lock:
            with self._connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS incidents (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        risk_score INTEGER NOT NULL,
                        risk_level TEXT NOT NULL,
                        primary_threat TEXT NOT NULL,
                        breakdown TEXT,
                        events TEXT,
                        person_count INTEGER NOT NULL,
                        weapon_count INTEGER NOT NULL,
                        snapshot_path TEXT
                    )
                    """
                )

                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS telemetry (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        fps REAL NOT NULL,
                        risk_score INTEGER NOT NULL,
                        people_count INTEGER NOT NULL
                    )
                    """
                )
                conn.commit()

    def log_incident(
        self,
        risk_score: int,
        risk_level: str,
        primary_threat: str,
        breakdown: Dict[str, int],
        events: List[str],
        person_count: int,
        weapon_count: int,
        snapshot_path: Optional[str] = None,
    ) -> int:
        """Insert an incident record and return its row ID."""
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with self.lock:
            with self._connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO incidents (
                        timestamp, risk_score, risk_level, primary_threat,
                        breakdown, events, person_count, weapon_count, snapshot_path
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        now_str,
                        risk_score,
                        risk_level,
                        primary_threat,
                        json.dumps(breakdown),
                        json.dumps(events),
                        person_count,
                        weapon_count,
                        snapshot_path or "",
                    ),
                )
                conn.commit()
                return cursor.lastrowid

    def log_telemetry(self, fps: float, risk_score: int, people_count: int) -> None:
        """Record real-time system performance and occupancy metrics."""
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with self.lock:
            with self._connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO telemetry (timestamp, fps, risk_score, people_count)
                    VALUES (?, ?, ?, ?)
                    """,
                    (now_str, round(fps, 1), risk_score, people_count),
                )
                conn.commit()

    def get_recent_incidents(self, limit: int = 25) -> List[Dict[str, Any]]:
        """Retrieve recent incident records for dashboard display."""
        with self.lock:
            with self._connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT * FROM incidents
                    ORDER BY id DESC
                    LIMIT ?
                    """,
                    (limit,),
                )
                rows = cursor.fetchall()
                results = []
                for row in rows:
                    item = dict(row)
                    try:
                        item["breakdown"] = json.loads(item["breakdown"]) if item["breakdown"] else {}
                    except Exception:
                        item["breakdown"] = {}
                    try:
                        item["events"] = json.loads(item["events"]) if item["events"] else []
                    except Exception:
                        item["events"] = []
                    results.append(item)
                return results

    def get_summary_stats(self) -> Dict[str, Any]:
        """Aggregate high-level metrics for dashboard cards."""
        with self.lock:
            with self._connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM incidents")
                total_incidents = cursor.fetchone()[0]

                cursor.execute("SELECT COUNT(*) FROM incidents WHERE risk_level = 'CRITICAL'")
                critical_count = cursor.fetchone()[0]

                cursor.execute("SELECT COUNT(*) FROM incidents WHERE risk_level = 'HIGH'")
                high_count = cursor.fetchone()[0]

                cursor.execute("SELECT MAX(risk_score) FROM incidents")
                max_score = cursor.fetchone()[0] or 0

                return {
                    "total_incidents": total_incidents,
                    "critical_count": critical_count,
                    "high_count": high_count,
                    "max_score": max_score,
                }
