"""Object Detection Module for Rakshak.

Handles dual detection:
1. Scene model (YOLOv8n) for Person and Normal Everyday Objects (Phones, Bottles, Bags).
2. Weapon model (Fine-tuned Firearm model + Knife/Scissors) for Weapons.
Explicitly tags Normal Objects as SAFE to suppress false alarms.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple, Optional, Dict
import numpy as np
from ultralytics import YOLO


@dataclass
class Detection:
    """Standard detection representation across Rakshak."""
    bbox: Tuple[int, int, int, int]  # (x1, y1, x2, y2) in pixel coords
    confidence: float
    class_id: int
    class_name: str
    category: str  # 'PERSON', 'WEAPON', 'NORMAL_OBJECT'

    @property
    def center(self) -> Tuple[int, int]:
        x1, y1, x2, y2 = self.bbox
        return (int((x1 + x2) / 2), int((y1 + y2) / 2))

    @property
    def bottom_center(self) -> Tuple[int, int]:
        """Footpoint of the detection (key for ground-plane zone checks)."""
        x1, y1, x2, y2 = self.bbox
        return (int((x1 + x2) / 2), int(y2))

    @property
    def area(self) -> int:
        x1, y1, x2, y2 = self.bbox
        return max(0, x2 - x1) * max(0, y2 - y1)


class ObjectDetector:
    """Unified detector that isolates Persons, Weapons, and Normal everyday items."""

    PERSON_CLASS_ID = 0

    # Everyday objects from COCO that frequently cause false weapon alerts
    NORMAL_OBJECT_MAP: Dict[int, str] = {
        67: "cell phone",
        24: "backpack",
        26: "handbag",
        28: "suitcase",
        39: "bottle",
        41: "cup",
        73: "book",
        25: "umbrella",
    }

    # Sharp objects from COCO to include as weapons if no dedicated knife model
    FALLBACK_WEAPON_MAP: Dict[int, str] = {
        43: "knife",
        76: "scissors",
    }

    def __init__(
        self,
        scene_model_path: str = "yolov8n.pt",
        weapon_model_path: Optional[str] = "models/hf_firearm/weights/best.pt",
        device: str = "cpu",
        person_conf: float = 0.40,
        weapon_conf: float = 0.35,
        normal_obj_conf: float = 0.35,
    ):
        self.device = device
        self.person_conf = person_conf
        self.weapon_conf = weapon_conf
        self.normal_obj_conf = normal_obj_conf

        # Load Scene Model (YOLOv8n for Person and everyday COCO classes)
        self.scene_model = YOLO(scene_model_path)

        # Load Dedicated Weapon Model if available
        self.weapon_model = None
        if weapon_model_path and Path(weapon_model_path).exists():
            try:
                self.weapon_model = YOLO(weapon_model_path)
            except Exception as e:
                print(f"[RAKSHAK:Detector] Warning: Could not load weapon model {weapon_model_path}: {e}")

    def detect(self, frame: np.ndarray) -> List[Detection]:
        """Perform unified detection on a single frame.

        Returns a combined list of Person, Weapon, and Normal Object detections.
        """
        detections: List[Detection] = []

        # 1. Run Scene Model (Person & Normal Objects & Fallback weapons)
        scene_results = self.scene_model(
            frame,
            conf=min(self.person_conf, self.normal_obj_conf),
            device=self.device,
            verbose=False,
        )

        if scene_results and len(scene_results) > 0:
            boxes = scene_results[0].boxes
            if boxes is not None:
                for i in range(len(boxes)):
                    cls_id = int(boxes.cls[i].item())
                    conf = float(boxes.conf[i].item())
                    xyxy = boxes.xyxy[i].cpu().numpy().astype(int)
                    bbox = (int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3]))

                    # Person
                    if cls_id == self.PERSON_CLASS_ID and conf >= self.person_conf:
                        detections.append(
                            Detection(
                                bbox=bbox,
                                confidence=conf,
                                class_id=cls_id,
                                class_name="person",
                                category="PERSON",
                            )
                        )
                    # Normal Object (Explicitly distinguished)
                    elif cls_id in self.NORMAL_OBJECT_MAP and conf >= self.normal_obj_conf:
                        name = self.NORMAL_OBJECT_MAP[cls_id]
                        detections.append(
                            Detection(
                                bbox=bbox,
                                confidence=conf,
                                class_id=cls_id,
                                class_name=name,
                                category="NORMAL_OBJECT",
                            )
                        )
                    # Fallback Weapon (Knife / Scissors from COCO)
                    elif cls_id in self.FALLBACK_WEAPON_MAP and conf >= self.weapon_conf:
                        name = self.FALLBACK_WEAPON_MAP[cls_id]
                        detections.append(
                            Detection(
                                bbox=bbox,
                                confidence=conf,
                                class_id=cls_id,
                                class_name=name,
                                category="WEAPON",
                            )
                        )

        # 2. Run Specialized Weapon Model (if loaded)
        if self.weapon_model is not None:
            weapon_results = self.weapon_model(
                frame,
                conf=self.weapon_conf,
                device=self.device,
                verbose=False,
            )

            if weapon_results and len(weapon_results) > 0:
                w_boxes = weapon_results[0].boxes
                if w_boxes is not None:
                    w_names = self.weapon_model.names
                    for i in range(len(w_boxes)):
                        w_cls_id = int(w_boxes.cls[i].item())
                        w_conf = float(w_boxes.conf[i].item())
                        w_xyxy = w_boxes.xyxy[i].cpu().numpy().astype(int)
                        w_bbox = (int(w_xyxy[0]), int(w_xyxy[1]), int(w_xyxy[2]), int(w_xyxy[3]))
                        w_name = w_names.get(w_cls_id, "weapon") if isinstance(w_names, dict) else "weapon"

                        # Filter out possible 'person' detections from weapon model
                        if str(w_name).lower() in ["person", "human", "people"]:
                            continue

                        # Avoid exact duplicate boxes with fallback knife
                        if not any(
                            d.category == "WEAPON" and self._iou(d.bbox, w_bbox) > 0.6
                            for d in detections
                        ):
                            detections.append(
                                Detection(
                                    bbox=w_bbox,
                                    confidence=w_conf,
                                    class_id=w_cls_id,
                                    class_name=str(w_name).lower(),
                                    category="WEAPON",
                                )
                            )

        return detections

    @staticmethod
    def _iou(boxA: Tuple[int, int, int, int], boxB: Tuple[int, int, int, int]) -> float:
        """Compute Intersection over Union between two bounding boxes."""
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        if interArea == 0:
            return 0.0

        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
        return interArea / float(boxAArea + boxBArea - interArea)
