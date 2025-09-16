"""Lyra agent: educational and creative assistant."""

from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any, Dict, List

from agents.base import BaseAgent, resolve_platform_log

# Optional external tools:
# REQUIRES pytesseract — Not installed by default (OCR)
#   apt-get update && apt-get install -y tesseract-ocr && pip install pytesseract pillow
# REQUIRES OpenAI-compatible LLM client — If env config provides model endpoint
#   pip install openai


class LyraAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("lyra", description="Creative tutor and herbalist")
        self._log_dir = Path("logs/lyra")
        self._log_dir.mkdir(parents=True, exist_ok=True)
        self._platform_log = resolve_platform_log("lyra")

    def _append_json(self, filename: str, entry: Dict[str, Any]) -> None:
        file_path = self._log_dir / filename
        data: List[Dict[str, Any]] = []
        if file_path.exists():
            data = json.loads(file_path.read_text(encoding="utf-8"))
        data.append(entry)
        file_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def _log(self, entry: Dict[str, Any]) -> None:
        try:
            with self._platform_log.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception:
            pass

    def _wrap(
        self, command: str, details: Dict[str, Any] | None, error: str | None
    ) -> Dict[str, Any]:
        success = error is None
        summary = f"Lyra completed '{command}'" if success else f"Lyra failed '{command}': {error}"
        self._log({"command": command, "success": success, "error": error})
        return {
            "success": success,
            "output": {
                "summary": summary,
                "details": details or {},
                "logs_path": str(self._platform_log),
            },
            "error": error,
        }

    def _llm_generate(self, prompt: str) -> str:
        # Try OpenAI-compatible client if available; otherwise simple stylistic transform
        try:
            import os
            import openai  # type: ignore

            key = os.getenv("OPENAI_API_KEY") or os.getenv("LM_API_KEY")
            base = os.getenv("OPENAI_BASE_URL") or os.getenv("LM_BASE_URL")
            if key and base:
                openai.api_key = key
                openai.base_url = base
            # New API (openai>=1) compatibility
            client = getattr(openai, "OpenAI", None)
            if client:
                client = client()
                resp = client.chat.completions.create(
                    model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.8,
                )
                return resp.choices[0].message.content or ""
        except Exception:
            pass
        # Fallback
        return f"[creative] {prompt.strip()} — crafted with warmth and clarity."

    def _ocr_image(self, image_path: Path) -> str:
        try:
            from PIL import Image  # type: ignore
            import pytesseract  # type: ignore

            return pytesseract.image_to_string(Image.open(str(image_path)))
        except Exception:
            return ""

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command == "caption_image":
                img = Path(args.get("path", ""))
                if not img.is_file():
                    return self._wrap(command, None, f"image not found: {img}")
                ocr_text = self._ocr_image(img)
                prompt = (
                    f"Write a concise, evocative caption for an image. Extracted text: {ocr_text!r}"
                )
                caption = self._llm_generate(prompt)
                details = {"path": str(img.resolve()), "caption": caption, "ocr_text": ocr_text}
                return self._wrap(command, details, None)

            if command == "write_bio":
                name = args.get("name", "Anonymous")
                style = args.get("style", "friendly")
                prompt = f"Write a short {style} bio for {name}. Keep it under 80 words."
                text = self._llm_generate(prompt)
                return self._wrap(command, {"bio": text, "style": style}, None)

            if command == "plant_id":
                img = Path(args.get("path", ""))
                if not img.is_file():
                    return self._wrap(command, None, f"image not found: {img}")
                # Minimal heuristic: use OCR and filename tokens as clues
                ocr_text = self._ocr_image(img)
                tokens = (img.stem + " " + ocr_text).lower()
                guess = "unknown"
                for plant in ["mint", "basil", "rosemary", "lavender", "dandelion", "oak", "pine"]:
                    if plant in tokens:
                        guess = plant
                        break
                return self._wrap(
                    command, {"path": str(img), "guess": guess, "evidence": ocr_text[:200]}, None
                )

            if command == "create_prompt":
                ptype = args.get("type", "writing")
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
                prompt = random.choice(prompts.get(ptype, prompts["writing"]))
                return self._wrap(command, {"prompt": prompt, "type": ptype}, None)

            if command == "evaluate_progress":
                entry = {"student": args.get("student"), "score": args.get("score")}
                self._append_json("progress.json", entry)
                return self._wrap(command, entry, None)

            if command == "dose_guide":
                guides = {"ginger": 10, "mint": 5, "chamomile": 8}  # mg per kg
                herb = args.get("herb")
                weight = float(args.get("weight_kg", 0))
                if herb not in guides:
                    return self._wrap(command, None, f"no dosage guide for {herb}")
                dose = guides[herb] * weight
                return self._wrap(
                    command, {"dose_mg": dose, "herb": herb, "weight_kg": weight}, None
                )

            return self._wrap(command or "", None, f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return self._wrap(command or "", None, str(exc))
