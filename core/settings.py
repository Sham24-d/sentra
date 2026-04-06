import json
from dataclasses import dataclass, field
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
SETTINGS_PATH = BASE_DIR / "sentra_settings.json"


@dataclass
class EventSetting:
    confirm_frames: int
    alarm: bool
    snapshot: bool
    overlay: str


def _default_event_settings():
    return {
        "weapon": EventSetting(confirm_frames=3, alarm=True, snapshot=True, overlay="WEAPON DETECTED"),
        "throw": EventSetting(confirm_frames=4, alarm=True, snapshot=True, overlay="THROW DETECTED"),
        "abnormal": EventSetting(confirm_frames=4, alarm=True, snapshot=True, overlay="ABNORMAL ACTIVITY"),
        "trespass": EventSetting(confirm_frames=5, alarm=False, snapshot=False, overlay="RESTRICTED ZONE"),
    }


@dataclass
class SystemSettings:
    scene_model_path: str = "yolov8n.pt"
    weapon_model_path: str = "models/hf_firearm/weights/best.pt"
    use_hf_weapon_model: bool = True
    person_confidence: float = 0.5
    fallback_weapon_confidence: float = 0.6
    hf_weapon_confidence: float = 0.45
    alert_cooldown_seconds: int = 8
    camera_index: int = 0
    frame_stride: int = 2
    capture_width: int = 640
    capture_height: int = 360
    scene_imgsz: int = 640
    weapon_imgsz: int = 512
    pose_imgsz: int = 320
    weapon_inference_interval: int = 3
    pose_inference_interval: int = 4
    restricted_zone: tuple[int, int, int, int] = (260, 70, 470, 300)
    event_settings: dict[str, EventSetting] = field(default_factory=_default_event_settings)

    def resolve_path(self, path_str: str) -> Path:
        path = Path(path_str)
        if path.is_absolute():
            return path
        return BASE_DIR / path

    def resolved_scene_model_path(self) -> Path:
        return self.resolve_path(self.scene_model_path)

    def resolved_weapon_model_path(self) -> Path:
        return self.resolve_path(self.weapon_model_path)


def load_settings() -> SystemSettings:
    settings = SystemSettings()
    if not SETTINGS_PATH.exists():
        return settings

    data = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))

    event_settings = _default_event_settings()
    if "event_settings" in data:
        for name, value in data["event_settings"].items():
            event_settings[name] = EventSetting(
                confirm_frames=int(value["confirm_frames"]),
                alarm=bool(value["alarm"]),
                snapshot=bool(value["snapshot"]),
                overlay=str(value["overlay"]),
            )

    restricted_zone = tuple(data.get("restricted_zone", settings.restricted_zone))

    return SystemSettings(
        scene_model_path=data.get("scene_model_path", settings.scene_model_path),
        weapon_model_path=data.get("weapon_model_path", settings.weapon_model_path),
        use_hf_weapon_model=bool(data.get("use_hf_weapon_model", settings.use_hf_weapon_model)),
        person_confidence=float(data.get("person_confidence", settings.person_confidence)),
        fallback_weapon_confidence=float(data.get("fallback_weapon_confidence", settings.fallback_weapon_confidence)),
        hf_weapon_confidence=float(data.get("hf_weapon_confidence", settings.hf_weapon_confidence)),
        alert_cooldown_seconds=int(data.get("alert_cooldown_seconds", settings.alert_cooldown_seconds)),
        camera_index=int(data.get("camera_index", settings.camera_index)),
        frame_stride=max(1, int(data.get("frame_stride", settings.frame_stride))),
        capture_width=int(data.get("capture_width", settings.capture_width)),
        capture_height=int(data.get("capture_height", settings.capture_height)),
        scene_imgsz=int(data.get("scene_imgsz", settings.scene_imgsz)),
        weapon_imgsz=int(data.get("weapon_imgsz", settings.weapon_imgsz)),
        pose_imgsz=int(data.get("pose_imgsz", settings.pose_imgsz)),
        weapon_inference_interval=max(1, int(data.get("weapon_inference_interval", settings.weapon_inference_interval))),
        pose_inference_interval=max(1, int(data.get("pose_inference_interval", settings.pose_inference_interval))),
        restricted_zone=restricted_zone,
        event_settings=event_settings,
    )
