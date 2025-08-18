import hashlib
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[3]))

from agents.glitch.agent import GlitchAgent
from agents.nova.agent import NovaAgent
from core.registry import AgentRegistry


def test_glitch_reports_file_metadata(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    sample = Path("sample.txt")
    sample.write_text("hello", encoding="utf-8")
    expected = hashlib.sha256(b"hello").hexdigest()

    registry = AgentRegistry()
    registry.register("glitch", GlitchAgent())
    nova = NovaAgent(registry)

    result = nova.run({"agent": "glitch", "payload": {"path": str(sample)}})
    assert result["success"] is True
    output = result["output"]
    assert output["sha256"] == expected
    assert output["size"] == 5
    assert Path(output["path"]).resolve() == sample.resolve()
