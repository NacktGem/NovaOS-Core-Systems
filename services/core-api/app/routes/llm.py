"""
LLM Management API for NovaOS GodMode Dashboard
Provides LM Studio/Ollama-like interface for direct agent communication
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List, Optional, AsyncIterator
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uuid

from agents.common.llm_integration import llm_manager
from agents.lyra.agent import LyraAgent
from agents.glitch.agent import GlitchAgent
from agents.velora.agent import VeloraAgent

# Import other agents as needed


class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str
    agent: Optional[str] = None
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    agent: str = "nova"
    provider: Optional[str] = None
    stream: bool = False
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class ChatResponse(BaseModel):
    id: str
    choices: List[Dict[str, Any]]
    usage: Optional[Dict[str, int]] = None
    agent: str


class ModelInfo(BaseModel):
    id: str
    object: str = "model"
    created: int
    owned_by: str = "novaos"
    provider: str
    status: str


class StreamChunk(BaseModel):
    id: str
    object: str = "chat.completion.chunk"
    created: int
    choices: List[Dict[str, Any]]
    agent: str


router = APIRouter(prefix="/api/llm", tags=["llm"])

# Agent registry
AGENTS = {
    "lyra": LyraAgent(),
    "glitch": GlitchAgent(),
    "velora": VeloraAgent(),
    # Add other agents as needed
}

# Active streaming sessions
streaming_sessions: Dict[str, AsyncIterator[str]] = {}


@router.get("/models")
async def list_models() -> Dict[str, List[ModelInfo]]:
    """List available LLM models and providers (LM Studio/Ollama compatible)."""
    models = []

    # Check provider health and list models
    health_status = await llm_manager.health_check()

    for provider in llm_manager.list_providers():
        status = "online" if health_status.get(provider, False) else "offline"

        # Add model info for each provider
        models.append(
            ModelInfo(
                id=f"{provider}-model",
                created=int(datetime.now().timestamp()),
                owned_by="novaos",
                provider=provider,
                status=status,
            )
        )

    return {"data": models}


@router.get("/agents")
async def list_agents() -> Dict[str, List[Dict[str, Any]]]:
    """List available NovaOS agents."""
    agent_list = []

    for agent_name, agent in AGENTS.items():
        agent_list.append(
            {
                "id": agent_name,
                "name": agent.name,
                "description": agent.description,
                "version": agent.version,
                "llm_enabled": agent.llm_enabled,
                "provider": agent.llm_provider,
            }
        )

    return {"data": agent_list}


@router.post("/chat/completions")
async def chat_completions(request: ChatRequest) -> ChatResponse | StreamingResponse:
    """Handle chat completions (OpenAI/LM Studio compatible API)."""

    # Get the requested agent
    agent = AGENTS.get(request.agent)
    if not agent:
        # Fall back to direct LLM
        return await _direct_llm_chat(request)

    # Prepare the conversation for the agent
    last_message = request.messages[-1] if request.messages else None
    if not last_message or last_message.role != "user":
        raise HTTPException(status_code=400, detail="Last message must be from user")

    conversation_context = "\n".join(
        [f"{msg.role}: {msg.content}" for msg in request.messages[:-1]]
    )

    if request.stream:
        return StreamingResponse(
            _stream_agent_response(agent, last_message.content, conversation_context),
            media_type="text/plain",
        )
    else:
        return await _complete_agent_response(agent, last_message.content, conversation_context)


async def _direct_llm_chat(request: ChatRequest) -> ChatResponse | StreamingResponse:
    """Direct LLM communication without agent wrapper."""

    # Build conversation for LLM
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages required")

    # Separate system messages from conversation
    system_messages = [msg for msg in request.messages if msg.role == "system"]
    user_messages = [msg for msg in request.messages if msg.role != "system"]

    system_prompt = "\n".join([msg.content for msg in system_messages]) if system_messages else None

    # Get the last user message
    last_user_msg = None
    for msg in reversed(user_messages):
        if msg.role == "user":
            last_user_msg = msg
            break

    if not last_user_msg:
        raise HTTPException(status_code=400, detail="No user message found")

    # Build conversation context
    conversation_context = "\n".join([f"{msg.role}: {msg.content}" for msg in user_messages[:-1]])

    full_prompt = (
        f"{conversation_context}\nuser: {last_user_msg.content}"
        if conversation_context
        else last_user_msg.content
    )

    if request.stream:
        return StreamingResponse(
            _stream_llm_response(full_prompt, system_prompt, request.provider),
            media_type="text/plain",
        )
    else:
        return await _complete_llm_response(full_prompt, system_prompt, request.provider)


async def _complete_agent_response(agent: Any, message: str, context: str) -> ChatResponse:
    """Generate complete response from agent."""

    # Build agent payload
    payload = {"command": "chat", "args": {"message": message, "context": context, "llm": True}}

    # Execute agent
    try:
        result = agent.run(payload)

        if result.get("success"):
            response_text = result["output"].get("response", "No response")
        else:
            response_text = f"Agent error: {result.get('error', 'Unknown error')}"

        return ChatResponse(
            id=str(uuid.uuid4()),
            choices=[
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": response_text},
                    "finish_reason": "stop",
                }
            ],
            agent=agent.name,
            usage={
                "prompt_tokens": len(message.split()),
                "completion_tokens": len(response_text.split()),
            },
        )

    except Exception as e:
        return ChatResponse(
            id=str(uuid.uuid4()),
            choices=[
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": f"Error: {str(e)}"},
                    "finish_reason": "error",
                }
            ],
            agent=agent.name,
        )


async def _complete_llm_response(
    prompt: str, system_prompt: Optional[str], provider: Optional[str]
) -> ChatResponse:
    """Generate complete response from LLM."""

    try:
        response_text = await llm_manager.generate(prompt, system_prompt, provider)

        return ChatResponse(
            id=str(uuid.uuid4()),
            choices=[
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": response_text},
                    "finish_reason": "stop",
                }
            ],
            agent="direct_llm",
            usage={
                "prompt_tokens": len(prompt.split()),
                "completion_tokens": len(response_text.split()),
            },
        )

    except Exception as e:
        return ChatResponse(
            id=str(uuid.uuid4()),
            choices=[
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": f"LLM Error: {str(e)}"},
                    "finish_reason": "error",
                }
            ],
            agent="direct_llm",
        )


async def _stream_agent_response(agent: Any, message: str, context: str) -> AsyncIterator[str]:
    """Stream response from agent."""

    session_id = str(uuid.uuid4())

    try:
        # For now, agents don't support native streaming, so we'll simulate it
        # by breaking the response into chunks

        # Build agent payload
        payload = {"command": "chat", "args": {"message": message, "context": context, "llm": True}}

        result = agent.run(payload)

        if result.get("success"):
            response_text = result["output"].get("response", "No response")

            # Simulate streaming by yielding chunks
            words = response_text.split()
            for i, word in enumerate(words):
                chunk = StreamChunk(
                    id=session_id,
                    created=int(datetime.now().timestamp()),
                    choices=[
                        {
                            "index": 0,
                            "delta": {"content": word + " " if i < len(words) - 1 else word},
                            "finish_reason": None if i < len(words) - 1 else "stop",
                        }
                    ],
                    agent=agent.name,
                )
                yield f"data: {chunk.model_dump_json()}\n\n"
                await asyncio.sleep(0.05)  # Small delay for streaming effect
        else:
            error_chunk = StreamChunk(
                id=session_id,
                created=int(datetime.now().timestamp()),
                choices=[
                    {
                        "index": 0,
                        "delta": {
                            "content": f"Agent error: {result.get('error', 'Unknown error')}"
                        },
                        "finish_reason": "error",
                    }
                ],
                agent=agent.name,
            )
            yield f"data: {error_chunk.model_dump_json()}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as e:
        error_chunk = StreamChunk(
            id=session_id,
            created=int(datetime.now().timestamp()),
            choices=[
                {"index": 0, "delta": {"content": f"Error: {str(e)}"}, "finish_reason": "error"}
            ],
            agent=agent.name,
        )
        yield f"data: {error_chunk.model_dump_json()}\n\n"
        yield "data: [DONE]\n\n"


async def _stream_llm_response(
    prompt: str, system_prompt: Optional[str], provider: Optional[str]
) -> AsyncIterator[str]:
    """Stream response from LLM."""

    session_id = str(uuid.uuid4())

    try:
        async for chunk_text in llm_manager.generate_stream(prompt, system_prompt, provider):
            chunk = StreamChunk(
                id=session_id,
                created=int(datetime.now().timestamp()),
                choices=[{"index": 0, "delta": {"content": chunk_text}, "finish_reason": None}],
                agent="direct_llm",
            )
            yield f"data: {chunk.model_dump_json()}\n\n"

        # Send completion
        final_chunk = StreamChunk(
            id=session_id,
            created=int(datetime.now().timestamp()),
            choices=[{"index": 0, "delta": {}, "finish_reason": "stop"}],
            agent="direct_llm",
        )
        yield f"data: {final_chunk.model_dump_json()}\n\n"
        yield "data: [DONE]\n\n"

    except Exception as e:
        error_chunk = StreamChunk(
            id=session_id,
            created=int(datetime.now().timestamp()),
            choices=[
                {"index": 0, "delta": {"content": f"LLM Error: {str(e)}"}, "finish_reason": "error"}
            ],
            agent="direct_llm",
        )
        yield f"data: {error_chunk.model_dump_json()}\n\n"
        yield "data: [DONE]\n\n"


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Check health of all LLM providers."""
    health_status = await llm_manager.health_check()
    return {
        "status": "healthy" if any(health_status.values()) else "unhealthy",
        "providers": health_status,
        "agents": {name: agent.llm_enabled for name, agent in AGENTS.items()},
    }


@router.post("/configure")
async def configure_agent_llm(
    agent_name: str, provider: str, system_prompt: Optional[str] = None
) -> Dict[str, Any]:
    """Configure LLM settings for a specific agent."""

    agent = AGENTS.get(agent_name)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_name} not found")

    success = agent.enable_llm(provider, system_prompt)

    return {
        "success": success,
        "agent": agent_name,
        "provider": provider if success else None,
        "llm_enabled": agent.llm_enabled,
    }
