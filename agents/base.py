"""Common interface for all NovaOS agents."""

from __future__ import annotations

import abc
import asyncio
import json
from typing import Any, Dict, Optional, AsyncIterator
from pathlib import Path

try:
    from agents.common.llm_integration import generate_llm_response, generate_llm_stream

    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False


def resolve_platform_log(agent_name: str) -> Path:
    """Return a writable log file path for the given agent.

    Prefers /logs/<agent>.log, but gracefully falls back to ./logs or /tmp/logs if
    /logs is not writable (helpful for local dev and tests). Always ensures the
    directory exists.
    """
    candidates = [Path("/logs"), Path.cwd() / "logs", Path("/tmp/logs")]
    for cand in candidates:
        try:
            cand.mkdir(parents=True, exist_ok=True)
            test_file = cand / ".write_test"
            test_file.write_text("ok", encoding="utf-8")
            try:
                test_file.unlink()
            except Exception:
                pass
            return cand / f"{agent_name}.log"
        except Exception:
            continue
    # Last resort: relative logs dir
    fallback = Path("logs")
    fallback.mkdir(parents=True, exist_ok=True)
    return fallback / f"{agent_name}.log"


class BaseAgent(abc.ABC):
    """Base class that defines the required agent interface with optional LLM integration."""

    def __init__(
        self,
        name: str,
        version: str = "1.0",
        description: str = "",
        llm_provider: Optional[str] = None,
        system_prompt: Optional[str] = None,
    ) -> None:
        self.name = name
        self.version = version
        self.description = description
        self.llm_provider = llm_provider
        self.system_prompt = system_prompt or self._default_system_prompt()
        self.llm_enabled = LLM_AVAILABLE and llm_provider is not None

    def _default_system_prompt(self) -> str:
        """Default system prompt for this agent."""
        return f"You are {self.name}, a specialized AI agent. {self.description}"

    async def generate_llm_response(
        self, prompt: str, override_system_prompt: Optional[str] = None
    ) -> str:
        """Generate LLM response if available, otherwise return fallback."""
        if not self.llm_enabled:
            return self._llm_fallback(prompt)

        try:
            system_prompt = override_system_prompt or self.system_prompt
            response = await generate_llm_response(prompt, system_prompt, self.llm_provider)
            return response
        except Exception as e:
            return f"LLM Error: {str(e)}"

    async def generate_llm_stream(
        self, prompt: str, override_system_prompt: Optional[str] = None
    ) -> AsyncIterator[str]:
        """Generate streaming LLM response if available."""
        if not self.llm_enabled:
            yield self._llm_fallback(prompt)
            return

        try:
            system_prompt = override_system_prompt or self.system_prompt
            async for chunk in generate_llm_stream(prompt, system_prompt, self.llm_provider):
                yield chunk
        except Exception as e:
            yield f"LLM Error: {str(e)}"

    def _llm_fallback(self, prompt: str) -> str:
        """Fallback response when LLM is not available."""
        return f"LLM not available. Received prompt: {prompt[:100]}..."

    def enable_llm(self, provider: str, system_prompt: Optional[str] = None) -> bool:
        """Enable LLM for this agent."""
        if not LLM_AVAILABLE:
            return False
        self.llm_provider = provider
        if system_prompt:
            self.system_prompt = system_prompt
        self.llm_enabled = True
        return True

    def disable_llm(self):
        """Disable LLM for this agent."""
        self.llm_enabled = False

    @abc.abstractmethod
    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agent logic and return a standardized response."""


# Backwards compatibility alias
Agent = BaseAgent
