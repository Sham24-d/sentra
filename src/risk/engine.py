"""Risk Intelligence Engine for Rakshak.

Implements an explainable, deterministic, multi-factor risk scoring formula:
Score = min(100, sum(w_i * event_i) + synergy_bonuses)

Categorizes incidents into LOW, MEDIUM, HIGH, and CRITICAL priorities.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple
from src.behavior.analyzer import BehaviorResult
from src.detection.detector import Detection


@dataclass
class RiskAssessment:
    """Comprehensive output of the Risk Engine."""
    score: int  # 0 to 100
    level: str  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    color_bgr: Tuple[int, int, int]
    breakdown: Dict[str, int] = field(default_factory=dict)
    primary_threat: str = "NORMAL"

    @property
    def is_actionable(self) -> bool:
        """Determines if operators should be alerted immediately."""
        return self.level in ("HIGH", "CRITICAL")


class RiskEngine:
    """Rule-based, auditable risk prioritization engine."""

    # UI Alert Colors (BGR format for OpenCV)
    COLORS = {
        "LOW": (80, 200, 80),        # Gentle Green
        "MEDIUM": (50, 215, 255),    # Golden Yellow
        "HIGH": (0, 140, 255),       # Urgent Orange
        "CRITICAL": (30, 30, 240),   # Neon Red
    }

    def __init__(
        self,
        weights: Dict[str, int] = None,
        synergies: Dict[str, int] = None,
        thresholds: Dict[str, int] = None,
    ):
        self.weights = weights or {
            "weapon_firearm": 60,
            "weapon_knife": 45,
            "intrusion": 30,
            "loitering": 15,
            "running": 15,
            "crowd": 10,
        }
        self.synergies = synergies or {
            "weapon_and_intrusion": 25,
        }
        self.thresholds = thresholds or {
            "medium": 30,
            "high": 60,
            "critical": 80,
        }

    def evaluate(
        self,
        weapons: List[Detection],
        behavior: BehaviorResult,
        normal_objects: List[Detection] = None,
    ) -> RiskAssessment:
        """Compute composite risk score and generate explainable breakdown."""
        score = 0
        breakdown: Dict[str, int] = {}
        primary_threat = "NORMAL ACTIVITY"

        has_firearm = False
        has_knife = False

        # 1. Weapon Threat Assessment
        for w in weapons:
            w_name = w.class_name.lower()
            if "knife" in w_name or "scissors" in w_name:
                has_knife = True
            else:
                has_firearm = True

        if has_firearm:
            pts = self.weights.get("weapon_firearm", 60)
            score += pts
            breakdown["Firearm Detected"] = pts
            primary_threat = "WEAPON: FIREARM DETECTED"
        elif has_knife:
            pts = self.weights.get("weapon_knife", 45)
            score += pts
            breakdown["Edged Weapon Detected"] = pts
            primary_threat = "WEAPON: EDGED WEAPON DETECTED"

        # 2. Behavioral Threat Assessment
        # Intrusion
        if behavior.intruding_ids:
            pts = self.weights.get("intrusion", 30)
            score += pts
            breakdown[f"Zone Intrusion ({len(behavior.intruding_ids)} person)"] = pts
            if primary_threat == "NORMAL ACTIVITY":
                primary_threat = "RESTRICTED AREA BREACH"

        # Loitering
        if behavior.loitering_ids:
            pts = self.weights.get("loitering", 15)
            score += pts
            breakdown[f"Loitering Alert ({len(behavior.loitering_ids)} person)"] = pts
            if primary_threat == "NORMAL ACTIVITY":
                primary_threat = "SUSPICIOUS LOITERING"

        # Running / Rapid Movement
        if behavior.running_ids:
            pts = self.weights.get("running", 15)
            score += pts
            breakdown[f"Rapid Movement ({len(behavior.running_ids)} person)"] = pts
            if primary_threat == "NORMAL ACTIVITY":
                primary_threat = "ABNORMAL RAPID MOVEMENT"

        # Crowd Density
        if behavior.crowd_exceeded:
            pts = self.weights.get("crowd", 10)
            score += pts
            breakdown[f"Crowd Limit Exceeded ({behavior.crowd_count})"] = pts
            if primary_threat == "NORMAL ACTIVITY":
                primary_threat = "CROWD SURGE"

        # 3. Synergy Combinations
        # e.g., Weapon + Restricted Area Intrusion = armed trespass
        if (has_firearm or has_knife) and behavior.intruding_ids:
            bonus = self.synergies.get("weapon_and_intrusion", 25)
            score += bonus
            breakdown["Armed Intrusion Synergy"] = bonus
            primary_threat = "CRITICAL: ARMED ZONE INTRUDER"

        # Bound score to [0, 100]
        final_score = min(100, max(0, score))

        # 4. Map to Risk Tier
        if final_score >= self.thresholds.get("critical", 80):
            level = "CRITICAL"
        elif final_score >= self.thresholds.get("high", 60):
            level = "HIGH"
        elif final_score >= self.thresholds.get("medium", 30):
            level = "MEDIUM"
        else:
            level = "LOW"

        return RiskAssessment(
            score=final_score,
            level=level,
            color_bgr=self.COLORS[level],
            breakdown=breakdown,
            primary_threat=primary_threat,
        )
