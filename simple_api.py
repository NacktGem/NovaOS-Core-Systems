#!/usr/bin/env python3
"""
Simple Core API to get the NovaOS agent interface working.
Minimal implementation with just the /run endpoint.
"""

import sys
import os
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json

app = FastAPI(title="NovaOS Simple Core API")


class RunAgentRequest(BaseModel):
    agent: str
    command: str
    args: Dict[str, Any] = {}
    log: bool = False


@app.post("/run")
async def run_agent_orchestrator(request: RunAgentRequest):
    """
    Simple orchestrator endpoint for running agents.
    """
    try:
        # Import agent modules dynamically
        if request.agent == "nova":
            from agents.nova.agent import NovaAgent
            from core.registry import AgentRegistry

            registry = AgentRegistry()
            agent_instance = NovaAgent(registry)
        elif request.agent == "echo":
            from agents.echo.agent import EchoAgent

            agent_instance = EchoAgent()
        elif request.agent == "glitch":
            from agents.glitch.agent import GlitchAgent

            agent_instance = GlitchAgent()
        elif request.agent == "lyra":
            from agents.lyra.agent import LyraAgent

            agent_instance = LyraAgent()
        elif request.agent == "velora":
            from agents.velora.agent import VeloraAgent

            agent_instance = VeloraAgent()
        elif request.agent == "audita":
            from agents.audita.agent import AuditaAgent

            agent_instance = AuditaAgent()
        elif request.agent == "riven":
            from agents.riven.agent import RivenAgent

            agent_instance = RivenAgent()
        else:
            return {"success": False, "output": None, "error": f"Unknown agent: {request.agent}"}

        # Run the agent with the provided command and args
        result = agent_instance.run({"command": request.command, "args": request.args})
        return result

    except Exception as e:
        return {"success": False, "output": None, "error": str(e)}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "novaos-simple-core-api"}


@app.get("/")
async def root():
    return {"message": "NovaOS Simple Core API", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
