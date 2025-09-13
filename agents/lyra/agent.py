"""Lyra agent: educational and creative assistant."""
from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any, Dict, List

from agents.base import BaseAgent


class LyraAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("lyra", description="Creative tutor and herbalist")
        self._log_dir = Path("logs/lyra")
        self._log_dir.mkdir(parents=True, exist_ok=True)

    def _append_json(self, filename: str, entry: Dict[str, Any]) -> None:
        file_path = self._log_dir / filename
        data: List[Dict[str, Any]] = []
        if file_path.exists():
            data = json.loads(file_path.read_text(encoding="utf-8"))
        data.append(entry)
        file_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command == "generate_lesson":
                topic = args.get("topic", "")
                grade = args.get("grade", "")
                lesson = {
                    "topic": topic,
                    "grade": grade,
                    "sections": ["Introduction", "Activities", "Assessment"],
                }
                return {"success": True, "output": lesson, "error": None}

            if command == "evaluate_progress":
                entry = {"student": args.get("student"), "score": args.get("score")}
                self._append_json("progress.json", entry)
                return {"success": True, "output": entry, "error": None}

            if command == "create_prompt":
                prompts = {
                    "writing": [
                        "Write a letter to your future self.",
                        "Describe a day on Mars.",
                    ],
                    "art": [
                        "Sketch a plant that doesn't exist.",
                        "Draw the feeling of wind.",
                    ],
                }
                ptype = args.get("type", "writing")
                prompt = random.choice(prompts.get(ptype, prompts["writing"]))
                return {"success": True, "output": {"prompt": prompt}, "error": None}

            if command == "herb_log":
                entry = {"name": args.get("name"), "details": args.get("details", {})}
                self._append_json("herb_journal.json", entry)
                return {"success": True, "output": entry, "error": None}

            if command == "dose_guide":
                guides = {"ginger": 10, "mint": 5, "chamomile": 8}  # mg per kg
                herb = args.get("herb")
                weight = float(args.get("weight_kg", 0))
                if herb not in guides:
                    raise ValueError(f"no dosage guide for {herb}")
                dose = guides[herb] * weight
                return {"success": True, "output": {"dose_mg": dose}, "error": None}

            raise ValueError(f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
