import json
from pathlib import Path

from agents.echo.agent import EchoAgent
from agents.nova.agent import NovaAgent
from core.registry import AgentRegistry


def test_registry_invokes_agent(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    registry = AgentRegistry(token="s3cr3t")
    registry.register("echo", EchoAgent())
    nova = NovaAgent(registry)

    result = nova.run({"agent": "echo", "payload": {"message": "ping"}, "token": "s3cr3t"})

    assert result["success"] is True
    assert result["output"] == {"echo": "ping"}

    log_files = list(Path("logs").glob("echo-*.json"))
    assert log_files, "log file not created"
    data = json.loads(log_files[0].read_text(encoding="utf-8"))
    assert data["response"]["output"] == {"echo": "ping"}
