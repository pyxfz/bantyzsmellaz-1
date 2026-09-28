---
title: "10. Installation & Integration"
description: "Five-minute setups for OrcaRouter, Abliteration and Adverserial, plus open-source regression tooling."
---

## 10.1 OrcaRouter (5 min)

```bash
# 1. Sign up https://www.orcarouter.ai/ → API keys → sk-orca-...
# 2. (Optional) claim credits https://www.orcarouter.ai/offers
export ORCAROUTER_API_KEY=sk-orca-...
```

```python
from openai import OpenAI
client = OpenAI(base_url="https://api.orcarouter.ai/v1", api_key="sk-orca-...")
# triage cheap
triage = client.chat.completions.create(model="qwen/qwen3.8-27b-free",
  messages=[{"role":"user","content":"List attack surface for scope ... (auth ID ...)"}])
# gated repro (after approval)
repro = client.chat.completions.create(model="orca/orcacyber-zero-1.0",
  messages=[{"role":"user","content":"Reproduce CVE ... from diff ..."}])
print(repro.headers.get("x-orca-resolved-model"), repro.headers.get("x-orca-cache"))
```

MCP: `Continuum-AI-Corp/orcarouter-mcp-server` for Claude Desktop/Cursor/Windsurf. Lite self-host:
`git clone .../OrcaRouter-Lite`, `model="auto"`, BYOK, `http://localhost:8000/v1`.

## 10.2 Abliteration (5 min)

```bash
# 1. Sign up https://abliteration.ai/console → ak_...
export ABLIT_KEY=ak_YOUR_KEY
curl https://api.abliteration.ai/v1/chat/completions \
  -H "Authorization: Bearer $ABLIT_KEY" -H "Content-Type: application/json" \
  -d '{"model":"abliterated-model-large-v2","messages":[{"role":"user","content":"Hello"}]}'
# OpenAPI https://api.abliteration.ai/openapi.json
# Models https://api.abliteration.ai/v1/models ; Balance GET /credits/balance
```

LangChain/LlamaIndex: `ChatOpenAI(base_url="https://api.abliteration.ai/v1", api_key,
model="abliterated-model-large-v2")`. Promptfoo: built-in `abliteration-ai` provider for red-team evals.
Strix/CyberStrike/OpenCode: OpenAI-compat custom provider. Policy Gateway (Enterprise):
`POST /policy/chat/completions` with `policy_id, policy_user, project ID` →
Splunk/Datadog/Elastic/S3/webhook.

## 10.3 Adverserial (5 min)

```bash
# 1. Top up wallet https://billing.adverserial.ai/ ($10/$25/$50/$100, auto-refill optional)
# 2. Create API key in billing dashboard (Account API keys), name per tool
export ADVERSERIAL_API_KEY=sk-YOUR-KEY
# 3. Chat https://chat.adverserial.ai/ (may require V2 waitlist/Priority Slot); API is wallet-direct
```

```python
from openai import OpenAI
client = OpenAI(api_key="sk-YOUR-KEY", base_url="https://api.adverserial.ai/v1")
resp = client.chat.completions.create(model="lordx64/cyberkimi",
  messages=[{"role":"system","content":"You are a red-team operator assistant."},
            {"role":"user","content":"Write a Sigma rule for this behavior: ..."}],
  max_tokens=2048)
```

Claude Code/Cline: `ANTHROPIC_BASE_URL="https://api.adverserial.ai"`, `ANTHROPIC_AUTH_TOKEN`,
`ANTHROPIC_MODEL="lordx64/cyberkimi"`, `CLAUDE_CODE_MAX_CONTEXT_TOKENS=750000`. Codex CLI ≥0.134:
provider `base_url="https://api.adverserial.ai/v1" wire_api="responses"` + profile
`model="lordx64/cyberkimi" window 750000/compact 700000`. OpenCode: provider `cyberkimi` npm
`@ai-sdk/openai-compatible` baseURL `https://api.adverserial.ai/v1`, model
`cyberkimi/lordx64/cyberkimi` (see docs for ASCII-quote gotcha). Kimi Code `~/.kimi/config.toml`,
Hermes `~/.hermes/config.yaml + .env` (add `AWS_EC2_METADATA_DISABLED=true` on non-AWS). Full
reference: `https://adverserial.ai/docs.html`.

## 10.4 Open-source regression between audits

`promptfoo redteam run`, `garak`, `pyrit` (PyRIT #2306 requests Abliteration as target — wire `ABLIT_KEY`
as target; same pattern works for Adverserial keys).
