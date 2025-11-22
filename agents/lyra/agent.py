"""Lyra agent: educational and creative assistant."""

from __future__ import annotations

import json
import random
import asyncio
from pathlib import Path
from typing import Any, Dict, List, Sequence

from agents.base import BaseAgent
from agents.common.alog import info


class LyraAgent(BaseAgent):
    """Curates curriculum, creative prompts, and herbal guidance for NovaOS."""

    def __init__(self) -> None:
        """Initialize Lyra with deterministic storage paths."""
        system_prompt = """You are Lyra, NovaOS's creative tutor and herbalist. You specialize in:
        - Educational curriculum development
        - Creative writing and art prompts
        - Herbal medicine guidance and safety
        - Progress tracking and personalized learning

        Always provide safe, educational, and inspiring guidance. For herbal advice, emphasize safety and consulting healthcare providers."""

        super().__init__(
            "lyra",
            description="Creative tutor and herbalist",
            llm_provider="ollama",  # Default to local Ollama
            system_prompt=system_prompt,
        )
        self._log_dir = Path("logs/lyra")
        self._log_dir.mkdir(parents=True, exist_ok=True)

    def _append_json(self, filename: str, entry: Dict[str, Any]) -> None:
        """Persist structured journal entries to JSON with human-readable formatting."""
        file_path = self._log_dir / filename
        data: List[Dict[str, Any]] = []
        if file_path.exists():
            data = json.loads(file_path.read_text(encoding="utf-8"))
        data.append(entry)
        file_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    async def generate_lesson_plan_llm(self, topic: str, grade: str) -> Dict[str, Any]:
        """Create AI-enhanced lesson plan with LLM assistance."""
        prompt = f"""Create a comprehensive lesson plan for the topic "{topic}" suitable for {grade or 'multi-age'} learners.

        Structure the lesson plan with:
        1. Clear learning objectives (2-3 specific goals)
        2. Introduction activities (engaging hooks)
        3. Practice activities (hands-on learning)
        4. Assessment methods (creative evaluation)
        5. Required materials
        6. Time allocation

        Focus on experiential, creative learning that empowers students to explore and express their understanding."""

        if self.llm_enabled:
            try:
                response = await self.generate_llm_response(prompt)
                # Parse LLM response into structured format
                return {
                    "topic": topic,
                    "grade": grade or "multi-age",
                    "llm_generated": True,
                    "content": response,
                    "objectives": [
                        f"Learners articulate key principles of {topic} in their own voice",
                        f"Learners demonstrate mastery of {topic} through a creative artifact",
                    ],
                    "materials": ["journal", "audio recorder", "open-source references"],
                }
            except Exception as e:
                info("lyra.llm_error", {"error": str(e), "fallback": "static"})

        # Fallback to original implementation
        return self.generate_lesson_plan(topic, grade)

    def generate_lesson_plan(self, topic: str, grade: str) -> Dict[str, Any]:
        """Create a standards-aligned lesson plan with objectives and assessments."""
        scaffolds: Dict[str, Sequence[str]] = {
            "introduction": ["story hook", "guided discussion", "sensory warm-up"],
            "practice": ["paired exploration", "hands-on lab", "guided journaling"],
            "assessment": ["reflection prompt", "exit ticket", "demo recording"],
        }
        lesson = {
            "topic": topic,
            "grade": grade or "multi-age",
            "objectives": [
                f"Learners articulate key principles of {topic} in their own voice",
                f"Learners demonstrate mastery of {topic} through a creative artifact",
            ],
            "sequence": {
                "introduction": list(scaffolds["introduction"]),
                "practice": list(scaffolds["practice"]),
                "assessment": list(scaffolds["assessment"]),
            },
            "materials": ["journal", "audio recorder", "open-source references"],
        }
        return lesson

    def evaluate_progress(self, student: str | None, score: float | None) -> Dict[str, Any]:
        """Log learner progress snapshots while computing momentum."""
        entry = {"student": student, "score": score or 0.0}
        self._append_json("progress.json", entry)
        return entry

    def _select_prompt(self, prompt_type: str) -> str:
        """Choose a prompt from curated writing, art, and voice collections."""
        prompts: Dict[str, Sequence[str]] = {
            "writing": [
                "Write a letter to your future self.",
                "Describe a day on Mars.",
                "Chronicle the moment you reclaimed your creative power.",
            ],
            "art": [
                "Sketch a plant that doesn't exist.",
                "Draw the feeling of wind.",
                "Illustrate the sound of resilience.",
            ],
            "voice": [
                "Compose a chant that grounds your community.",
                "Record a sonic tour of your safe space.",
            ],
        }
        collection = prompts.get(prompt_type, prompts["writing"])
        return random.choice(list(collection))

    async def create_prompt_llm(self, prompt_type: str) -> Dict[str, Any]:
        """Generate AI-enhanced creative prompts."""
        if self.llm_enabled:
            llm_prompt = f"""Generate a creative {prompt_type} prompt that is:
            - Inspiring and thought-provoking
            - Safe and appropriate for all ages
            - Encouraging of personal expression and creativity
            - Connected to themes of empowerment, nature, or community

            Provide just the prompt itself, no additional explanation."""

            try:
                ai_prompt = await self.generate_llm_response(llm_prompt)
                return {
                    "type": prompt_type,
                    "prompt": ai_prompt.strip(),
                    "ritual": "light incense and set a 12-minute timer to maintain flow",
                    "ai_generated": True,
                }
            except Exception as e:
                info("lyra.llm_error", {"error": str(e), "fallback": "static"})

        # Fallback to curated prompts
        return self.create_prompt(prompt_type)

    def create_prompt(self, prompt_type: str) -> Dict[str, Any]:
        """Deliver a curated creative brief for the requested modality."""
        prompt = self._select_prompt(prompt_type)
        return {
            "type": prompt_type,
            "prompt": prompt,
            "ritual": "light incense and set a 12-minute timer to maintain flow",
        }

    def log_herb_entry(self, name: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Maintain a sovereign herbal apothecary journal."""
        entry = {"name": name, "details": details}
        self._append_json("herb_journal.json", entry)
        return entry


import json
import random
from pathlib import Path
from typing import Any, Dict, List, Sequence

from agents.base import BaseAgent
from agents.common.alog import info


class LyraAgent(BaseAgent):
    """Curates curriculum, creative prompts, and herbal guidance for NovaOS."""

    def __init__(self) -> None:
        """Initialize Lyra with deterministic storage paths."""
        super().__init__("lyra", description="Creative tutor and herbalist")
        self._log_dir = Path("logs/lyra")
        self._log_dir.mkdir(parents=True, exist_ok=True)

    def _append_json(self, filename: str, entry: Dict[str, Any]) -> None:
        """Persist structured journal entries to JSON with human-readable formatting."""
        file_path = self._log_dir / filename
        data: List[Dict[str, Any]] = []
        if file_path.exists():
            data = json.loads(file_path.read_text(encoding="utf-8"))
        data.append(entry)
        file_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def generate_lesson_plan(self, topic: str, grade: str) -> Dict[str, Any]:
        """Create a standards-aligned lesson plan with objectives and assessments."""
        scaffolds: Dict[str, Sequence[str]] = {
            "introduction": ["story hook", "guided discussion", "sensory warm-up"],
            "practice": ["paired exploration", "hands-on lab", "guided journaling"],
            "assessment": ["reflection prompt", "exit ticket", "demo recording"],
        }
        lesson = {
            "topic": topic,
            "grade": grade or "multi-age",
            "objectives": [
                f"Learners articulate key principles of {topic} in their own voice",
                f"Learners demonstrate mastery of {topic} through a creative artifact",
            ],
            "sequence": {
                "introduction": list(scaffolds["introduction"]),
                "practice": list(scaffolds["practice"]),
                "assessment": list(scaffolds["assessment"]),
            },
            "materials": ["journal", "audio recorder", "open-source references"],
        }
        return lesson

    def evaluate_progress(self, student: str | None, score: float | None) -> Dict[str, Any]:
        """Log learner progress snapshots while computing momentum."""
        entry = {"student": student, "score": score}
        self._append_json("progress.json", entry)
        return {
            "student": student,
            "score": score,
            "momentum": (
                "rising" if (score or 0) >= 85 else "steady" if (score or 0) >= 70 else "intervene"
            ),
        }

    def _select_prompt(self, prompt_type: str) -> str:
        """Choose a prompt from curated writing, art, and voice collections."""
        prompts: Dict[str, Sequence[str]] = {
            "writing": [
                "Write a letter to your future self.",
                "Describe a day on Mars.",
                "Chronicle the moment you reclaimed your creative power.",
            ],
            "art": [
                "Sketch a plant that doesn't exist.",
                "Draw the feeling of wind.",
                "Illustrate the sound of resilience.",
            ],
            "voice": [
                "Compose a chant that grounds your community.",
                "Record a sonic tour of your safe space.",
            ],
        }
        collection = prompts.get(prompt_type, prompts["writing"])
        return random.choice(list(collection))

    def create_prompt(self, prompt_type: str) -> Dict[str, Any]:
        """Deliver a curated creative brief for the requested modality."""
        prompt = self._select_prompt(prompt_type)
        return {
            "type": prompt_type,
            "prompt": prompt,
            "ritual": "light incense and set a 12-minute timer to maintain flow",
        }

    def log_herb_entry(self, name: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Maintain a sovereign herbal apothecary journal."""
        entry = {"name": name, "details": details}
        self._append_json("herb_journal.json", entry)
        return entry

    def calculate_dose(self, herb: str, weight_kg: float) -> Dict[str, Any]:
        """Compute safe dosage using Nova's botanicals matrix."""
        guides = {
            "ginger": {"mg_per_kg": 10, "notes": "anti-inflammatory, warm"},
            "mint": {"mg_per_kg": 5, "notes": "cooling, digestion"},
            "chamomile": {"mg_per_kg": 8, "notes": "calming, sleep support"},
            "holy_basil": {"mg_per_kg": 6, "notes": "adaptogenic, breath"},
        }
        if herb not in guides:
            raise ValueError(f"no dosage guide for {herb}")
        guide = guides[herb]
        dose = guide["mg_per_kg"] * weight_kg
        return {"dose_mg": dose, "notes": guide["notes"]}

    def generate_curriculum_path(self, theme: str, weeks: int = 4) -> Dict[str, Any]:
        """Construct a multi-week curriculum with escalating depth."""
        phases = [
            "Awakening",
            "Exploration",
            "Mastery",
            "Transmission",
            "Legacy",
        ]
        schedule = []
        for week in range(weeks):
            phase = phases[min(week, len(phases) - 1)]
            schedule.append(
                {
                    "week": week + 1,
                    "phase": phase,
                    "focus": f"{theme} — {phase.lower()}",
                    "deliverable": "zine" if phase == "Legacy" else "artifact",
                }
            )
        return {"theme": theme, "weeks": weeks, "schedule": schedule}

    def recommend_herbal_protocol(self, concern: str) -> Dict[str, Any]:
        """Offer a resilient herbal protocol anchored in safety."""
        protocols = {
            "stress": {
                "morning": "holy basil tea",
                "evening": "chamomile infusion",
                "practice": "4-7-8 breath",
            },
            "immune": {
                "morning": "ginger tonic",
                "midday": "elderberry syrup",
                "practice": "sun salutation",
            },
            "focus": {
                "morning": "mint steam",
                "afternoon": "lion's mane tincture",
                "practice": "90-minute deep work",
            },
        }
        if concern not in protocols:
            raise ValueError("protocol unavailable")
        regimen = protocols[concern]
        self._append_json("protocols.json", {"concern": concern, "regimen": regimen})
        return {"concern": concern, "protocol": regimen}

    def compose_story_arc(self, protagonist: str) -> Dict[str, Any]:
        """Draft a three-beat narrative arc for creators who work with Lyra."""
        beats = [
            f"{protagonist} receives an encrypted glyph inviting them to Black Rose.",
            f"{protagonist} decodes ancestral lore through improvisational movement.",
            f"{protagonist} broadcasts a sovereign frequency that heals their collective.",
        ]
        return {"protagonist": protagonist, "beats": beats}

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Lyra commands with journaled side effects and optional LLM enhancement."""
        command = payload.get("command")
        args = payload.get("args", {})
        use_llm = args.get("llm", True) and self.llm_enabled  # Allow disabling LLM per command

        info(
            "lyra.command", {"command": command, "args": list(args.keys()), "llm_enabled": use_llm}
        )

        try:
            if command == "generate_lesson":
                if use_llm:
                    # Use async LLM generation
                    result = asyncio.run(
                        self.generate_lesson_plan_llm(args.get("topic", ""), args.get("grade", ""))
                    )
                else:
                    result = self.generate_lesson_plan(args.get("topic", ""), args.get("grade", ""))
                return {"success": True, "output": result, "error": None}

            if command == "evaluate_progress":
                result = self.evaluate_progress(args.get("student"), args.get("score"))
                return {"success": True, "output": result, "error": None}

            if command == "create_prompt":
                if use_llm:
                    result = asyncio.run(self.create_prompt_llm(args.get("type", "writing")))
                else:
                    result = self.create_prompt(args.get("type", "writing"))
                return {"success": True, "output": result, "error": None}

            if command == "herb_log":
                return {
                    "success": True,
                    "output": self.log_herb_entry(args.get("name"), args.get("details", {})),
                    "error": None,
                }

            if command == "dose_guide":
                return {
                    "success": True,
                    "output": self.calculate_dose(
                        args.get("herb", ""), float(args.get("weight_kg", 0))
                    ),
                    "error": None,
                }

            if command == "curriculum_path":
                return {
                    "success": True,
                    "output": self.generate_curriculum_path(
                        args.get("theme", ""), int(args.get("weeks", 4))
                    ),
                    "error": None,
                }

            if command == "herbal_protocol":
                return {
                    "success": True,
                    "output": self.recommend_herbal_protocol(args.get("concern", "")),
                    "error": None,
                }

            if command == "story_arc":
                return {
                    "success": True,
                    "output": self.compose_story_arc(args.get("protagonist", "Creator")),
                    "error": None,
                }

            # New LLM-specific commands
            if command == "chat":
                if use_llm:
                    response = asyncio.run(self.generate_llm_response(args.get("message", "")))
                    return {
                        "success": True,
                        "output": {"response": response, "agent": "lyra"},
                        "error": None,
                    }
                else:
                    return {"success": False, "output": None, "error": "LLM not available for chat"}

            if command == "stream_chat":
                if use_llm:
                    # For streaming, we'll return a session ID that can be used to get streaming data
                    session_id = f"lyra_stream_{hash(args.get('message', ''))}"
                    return {
                        "success": True,
                        "output": {"session_id": session_id, "streaming": True},
                        "error": None,
                    }
                else:
                    return {
                        "success": False,
                        "output": None,
                        "error": "LLM streaming not available",
                    }

            raise ValueError(f"unknown command '{command}'")

        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
