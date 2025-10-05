import json
from pathlib import Path

import pytest

from agents.echo.agent import EchoAgent
from agents.nova.agent import NovaAgent
from core.registry import AgentRegistry


def test_registry_invokes_agent(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    registry = AgentRegistry(token="s3cr3t")
    registry.register("echo", EchoAgent())
    nova = NovaAgent(registry)

    result = nova.run(
        {
            "agent": "echo",
            "command": "send_message",
            "args": {"message": "ping"},
            "token": "s3cr3t",
            "log": True,
        }
    )

    assert result["success"] is True
    assert result["output"] == {"message": "ping"}
    assert result["job_id"]

    log_file = Path("logs/echo") / f"{result['job_id']}.json"
    assert log_file.exists(), "log file not created"
    data = json.loads(log_file.read_text(encoding="utf-8"))
    assert data["response"]["output"] == {"message": "ping"}


def test_registry_logs_invalid_token(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    registry = AgentRegistry(token="s3cr3t")
    registry.register("echo", EchoAgent())
    nova = NovaAgent(registry)

    result = nova.run(
        {
            "agent": "echo",
            "command": "send_message",
            "args": {"message": "ping"},
            "token": "bad",
        }
    )

    assert result["success"] is False
    assert result["error"] == "invalid agent token"
    assert result["job_id"]

    log_file = Path("logs/echo") / f"{result['job_id']}.json"
    assert log_file.exists(), "log file not created for invalid token"
    data = json.loads(log_file.read_text(encoding="utf-8"))
    assert data["response"]["success"] is False
    assert data["response"]["error"] == "invalid agent token"


def test_registry_logs_missing_agent(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    registry = AgentRegistry()

    result = registry.call("ghost", {"command": "noop", "args": {}})

    assert result.success is False
    assert result.error == "agent 'ghost' not found"
    assert result.job_id

    log_file = Path("logs/ghost") / f"{result.job_id}.json"
    assert log_file.exists(), "log file not created for missing agent"
    data = json.loads(log_file.read_text(encoding="utf-8"))
    assert data["response"]["success"] is False
    assert data["response"]["error"] == "agent 'ghost' not found"
