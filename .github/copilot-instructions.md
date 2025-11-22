# NovaOS Core Systems - AI Coding Agent Guide

## Architecture Overview

NovaOS is a multi-domain platform with **7 specialized AI agents** and **3 application frontends**:

**Domains:**

- **NovaOS Console** (port 3002) - Founder/admin control interface
- **Black Rose Collective** (port 3000) - Creator platform with revenue analytics
- **GypsyCove Academy** (port 3001) - Family/educational platform

**Agent Architecture:**

```
agents/{agent}/agent.py - Core logic (BaseAgent subclass)
services/{agent}/app/main.py - FastAPI service wrapper
services/core-api/ - Central API router and database
```

All agents use Redis pub/sub with namespace isolation:

- Database 0: NovaOS
- Database 1: Black Rose
- Database 2: GypsyCove

## Critical Development Patterns

### Agent Implementation Structure

```python
# agents/{name}/agent.py
class {Name}Agent(BaseAgent):
    def __init__(self):
        super().__init__("name", llm_provider="ollama", system_prompt="...")

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        command = payload.get("command")
        args = payload.get("args", {})
        # Always return: {"success": bool, "output": dict, "error": str|None}
```

### LLM Integration (NEW)

Agents now support multiple LLM providers via `agents/common/llm_integration.py`:

- **OpenAI API** (requires OPENAI_API_KEY)
- **Ollama** (http://localhost:11434)
- **LM Studio** (http://localhost:1234)

Enable LLM for agents: `agent.enable_llm("ollama", system_prompt)`

### Service Wiring Pattern

```python
# services/{agent}/app/main.py
from agents.{agent}.agent import {Agent}Agent

_agent = {Agent}Agent()

@app.post("/run")
async def run_agent(job: RunJob, claims: IdentityClaims = Depends(authorize_headers)):
    result = _agent.run(job.model_dump())
    return result
```

## Platform-Specific Implementation

### Black Rose Creator Platform

- **Enhanced Dashboard**: `/apps/web-shell/app/blackrose/dashboard/page-enhanced.tsx`
- **Revenue Analytics**: Powered by enhanced Velora agent with 9+ analytics methods
- **API Integration**: `/apps/web-shell/app/api/creator/analytics/route.ts`

### Agent Command Reference

```bash
# Lyra (Creative/Educational)
generate_lesson, create_prompt, herb_log, curriculum_path, chat

# Glitch (Security/Forensics)
hash_file, scan_system, threat_intelligence, vulnerability_scan

# Velora (Analytics/Revenue)
creator_analytics, revenue_optimization, content_performance, pricing_optimization
```

## Critical File Locations

**Configuration:**

- `docker-compose.yml` - All services orchestration
- `ai_models/llm_config.json` - LLM provider configuration
- `.env.{service}` files - Environment variables per service

**Agent Enhancement Points:**

- `agents/base.py` - Enhanced with LLM capabilities
- `agents/common/llm_integration.py` - Multi-provider LLM support
- `services/core-api/app/routes/llm.py` - LM Studio/Ollama-compatible API

## Development Workflows

### Adding New Agent Commands

1. Add method to `agents/{agent}/agent.py`
2. Update `run()` method command routing
3. Test via `/api/agents/{agent}` endpoint
4. Update agent system prompt if using LLM

### LLM Integration Testing

```bash
# Check provider health
curl http://localhost:8760/api/llm/health

# Test agent chat
curl -X POST http://localhost:8760/api/llm/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"agent":"lyra"}'
```

### Redis Namespace Usage

```python
# In agent code - use database isolation
redis_client = redis.Redis(host="localhost", port=6379, db=1)  # Black Rose
```

## Security & Authentication

**Role Hierarchy:** `GODMODE → SUPER_ADMIN → ADMIN_AGENT → CREATOR_STANDARD → VERIFIED_USER → GUEST`

**Required Headers:**

- `AGENT_SHARED_TOKEN` - Inter-agent communication
- `INTERNAL_TOKEN` - Internal service calls
- `JWT` tokens - User authentication

## Common Anti-Patterns

❌ **Don't** hardcode agent responses - use LLM integration
❌ **Don't** bypass Redis namespaces - respect database isolation
❌ **Don't** skip error handling in agent.run() methods
❌ **Don't** use direct database calls - go through core-api

## Model and Asset Management

- `ai_models/.modelmap.json` - Model registry and download status
- `scripts/fetch_models.py` - HuggingFace model fetching
- `packages/` - Shared components between apps

## Key Integration Points

**Inter-Agent Communication:** Via Redis pub/sub channels
**Cross-Platform Analytics:** Velora agent serves all three domains
**Shared UI Components:** `/apps/shared/components/`
**Authentication:** JWT verification in all service routes

This codebase prioritizes agent-driven architecture with LLM enhancement, Redis-based communication, and multi-domain platform support.
