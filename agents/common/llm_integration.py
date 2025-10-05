"""LLM integration infrastructure for NovaOS agents."""

from __future__ import annotations

import json
import os
import asyncio
from pathlib import Path
from typing import Any, Dict, List, Optional, Union, AsyncIterator
import httpx
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class LLMConfig:
    """Configuration for LLM integration."""

    provider: str  # "openai", "ollama", "lm_studio", "local"
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    temperature: float = 0.7
    max_tokens: Optional[int] = None


class LLMProvider:
    """Base class for LLM providers."""

    def __init__(self, config: LLMConfig):
        self.config = config
        self.client = None

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate text completion."""
        raise NotImplementedError

    async def generate_stream(
        self, prompt: str, system_prompt: Optional[str] = None
    ) -> AsyncIterator[str]:
        """Generate streaming text completion."""
        raise NotImplementedError

    async def health_check(self) -> bool:
        """Check if the provider is available."""
        raise NotImplementedError


class OpenAIProvider(LLMProvider):
    """OpenAI API provider."""

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        try:
            import openai

            self.client = openai.AsyncOpenAI(api_key=config.api_key, base_url=config.base_url)
        except ImportError:
            logger.error("OpenAI package not installed")
            raise

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate completion using OpenAI API."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self.client.chat.completions.create(
                model=self.config.model,
                messages=messages,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            return f"Error: {str(e)}"

    async def generate_stream(
        self, prompt: str, system_prompt: Optional[str] = None
    ) -> AsyncIterator[str]:
        """Generate streaming completion."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            stream = await self.client.chat.completions.create(
                model=self.config.model,
                messages=messages,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"OpenAI streaming failed: {e}")
            yield f"Error: {str(e)}"

    async def health_check(self) -> bool:
        """Check OpenAI API health."""
        try:
            await self.client.models.list()
            return True
        except Exception:
            return False


class OllamaProvider(LLMProvider):
    """Ollama local provider."""

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        self.base_url = config.base_url or "http://localhost:11434"

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate completion using Ollama."""
        async with httpx.AsyncClient() as client:
            try:
                payload = {
                    "model": self.config.model,
                    "prompt": prompt,
                    "system": system_prompt,
                    "stream": False,
                    "options": {
                        "temperature": self.config.temperature,
                        "num_predict": self.config.max_tokens or -1,
                    },
                }

                response = await client.post(
                    f"{self.base_url}/api/generate", json=payload, timeout=60.0
                )
                response.raise_for_status()
                result = response.json()
                return result.get("response", "No response")
            except Exception as e:
                logger.error(f"Ollama generation failed: {e}")
                return f"Error: {str(e)}"

    async def generate_stream(
        self, prompt: str, system_prompt: Optional[str] = None
    ) -> AsyncIterator[str]:
        """Generate streaming completion."""
        async with httpx.AsyncClient() as client:
            try:
                payload = {
                    "model": self.config.model,
                    "prompt": prompt,
                    "system": system_prompt,
                    "stream": True,
                    "options": {
                        "temperature": self.config.temperature,
                        "num_predict": self.config.max_tokens or -1,
                    },
                }

                async with client.stream(
                    "POST", f"{self.base_url}/api/generate", json=payload, timeout=60.0
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                if "response" in data:
                                    yield data["response"]
                                if data.get("done", False):
                                    break
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                logger.error(f"Ollama streaming failed: {e}")
                yield f"Error: {str(e)}"

    async def health_check(self) -> bool:
        """Check Ollama health."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/api/tags", timeout=5.0)
                return response.status_code == 200
            except Exception:
                return False


class LMStudioProvider(LLMProvider):
    """LM Studio local provider."""

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        self.base_url = config.base_url or "http://localhost:1234"

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate completion using LM Studio."""
        async with httpx.AsyncClient() as client:
            try:
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                payload = {
                    "model": self.config.model,
                    "messages": messages,
                    "temperature": self.config.temperature,
                    "max_tokens": self.config.max_tokens,
                    "stream": False,
                }

                response = await client.post(
                    f"{self.base_url}/v1/chat/completions", json=payload, timeout=60.0
                )
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"]
            except Exception as e:
                logger.error(f"LM Studio generation failed: {e}")
                return f"Error: {str(e)}"

    async def generate_stream(
        self, prompt: str, system_prompt: Optional[str] = None
    ) -> AsyncIterator[str]:
        """Generate streaming completion."""
        async with httpx.AsyncClient() as client:
            try:
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                payload = {
                    "model": self.config.model,
                    "messages": messages,
                    "temperature": self.config.temperature,
                    "max_tokens": self.config.max_tokens,
                    "stream": True,
                }

                async with client.stream(
                    "POST", f"{self.base_url}/v1/chat/completions", json=payload, timeout=60.0
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str.strip() == "[DONE]":
                                break
                            try:
                                data = json.loads(data_str)
                                if data["choices"][0]["delta"].get("content"):
                                    yield data["choices"][0]["delta"]["content"]
                            except (json.JSONDecodeError, KeyError):
                                continue
            except Exception as e:
                logger.error(f"LM Studio streaming failed: {e}")
                yield f"Error: {str(e)}"

    async def health_check(self) -> bool:
        """Check LM Studio health."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/v1/models", timeout=5.0)
                return response.status_code == 200
            except Exception:
                return False


class LLMManager:
    """Manages multiple LLM providers and configurations."""

    def __init__(self):
        self.providers: Dict[str, LLMProvider] = {}
        self.default_provider: Optional[str] = None
        self._load_config()

    def _load_config(self):
        """Load LLM configuration from environment and config files."""
        config_path = Path("ai_models/llm_config.json")

        # Default configurations
        configs = {}

        # OpenAI configuration
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            configs["openai"] = LLMConfig(
                provider="openai",
                model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
                api_key=openai_key,
                temperature=float(os.getenv("OPENAI_TEMPERATURE", "0.7")),
                max_tokens=int(os.getenv("OPENAI_MAX_TOKENS", "2048")),
            )

        # Ollama configuration
        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        configs["ollama"] = LLMConfig(
            provider="ollama",
            model=os.getenv("OLLAMA_MODEL", "llama3.1:8b"),
            base_url=ollama_url,
            temperature=float(os.getenv("OLLAMA_TEMPERATURE", "0.7")),
            max_tokens=int(os.getenv("OLLAMA_MAX_TOKENS", "2048")),
        )

        # LM Studio configuration
        lmstudio_url = os.getenv("LMSTUDIO_BASE_URL", "http://localhost:1234")
        configs["lm_studio"] = LLMConfig(
            provider="lm_studio",
            model=os.getenv("LMSTUDIO_MODEL", "local-model"),
            base_url=lmstudio_url,
            temperature=float(os.getenv("LMSTUDIO_TEMPERATURE", "0.7")),
            max_tokens=int(os.getenv("LMSTUDIO_MAX_TOKENS", "2048")),
        )

        # Load from config file if exists
        if config_path.exists():
            try:
                with open(config_path) as f:
                    file_config = json.load(f)
                    for name, config_data in file_config.items():
                        configs[name] = LLMConfig(**config_data)
            except Exception as e:
                logger.error(f"Failed to load LLM config: {e}")

        # Initialize providers
        for name, config in configs.items():
            try:
                if config.provider == "openai":
                    self.providers[name] = OpenAIProvider(config)
                elif config.provider == "ollama":
                    self.providers[name] = OllamaProvider(config)
                elif config.provider == "lm_studio":
                    self.providers[name] = LMStudioProvider(config)

                if not self.default_provider:
                    self.default_provider = name
            except Exception as e:
                logger.error(f"Failed to initialize provider {name}: {e}")

    async def generate(
        self, prompt: str, system_prompt: Optional[str] = None, provider: Optional[str] = None
    ) -> str:
        """Generate text using specified or default provider."""
        provider_name = provider or self.default_provider
        if not provider_name or provider_name not in self.providers:
            return "Error: No LLM provider available"

        return await self.providers[provider_name].generate(prompt, system_prompt)

    async def generate_stream(
        self, prompt: str, system_prompt: Optional[str] = None, provider: Optional[str] = None
    ) -> AsyncIterator[str]:
        """Generate streaming text using specified or default provider."""
        provider_name = provider or self.default_provider
        if not provider_name or provider_name not in self.providers:
            yield "Error: No LLM provider available"
            return

        async for chunk in self.providers[provider_name].generate_stream(prompt, system_prompt):
            yield chunk

    async def health_check(self, provider: Optional[str] = None) -> Dict[str, bool]:
        """Check health of providers."""
        if provider:
            if provider in self.providers:
                return {provider: await self.providers[provider].health_check()}
            return {provider: False}

        results = {}
        for name, provider_instance in self.providers.items():
            results[name] = await provider_instance.health_check()
        return results

    def list_providers(self) -> List[str]:
        """List available providers."""
        return list(self.providers.keys())


# Global LLM manager instance
llm_manager = LLMManager()


# Convenience functions
async def generate_llm_response(
    prompt: str, system_prompt: Optional[str] = None, provider: Optional[str] = None
) -> str:
    """Generate LLM response using global manager."""
    return await llm_manager.generate(prompt, system_prompt, provider)


async def generate_llm_stream(
    prompt: str, system_prompt: Optional[str] = None, provider: Optional[str] = None
) -> AsyncIterator[str]:
    """Generate streaming LLM response using global manager."""
    async for chunk in llm_manager.generate_stream(prompt, system_prompt, provider):
        yield chunk
